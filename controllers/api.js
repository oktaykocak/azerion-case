/*!
 * azerion-case
 * Copyright(c) 2021 Oktay Koçak
 * Do What The F*ck You Want To Public Licensed
 */

const { v4: uuidv4 } = require("uuid");
var sharp = require("sharp");
var Utils = require("../utils/util");
var path = require("path");

/**
 * Return records from database call.
 *
 * @param {Object} req
 * @param {ServerResponse} res
 * @return {ServerResponse}
 * @public
 */

exports.processImage = async function (req, res) {
  try {
    Utils.validateProcessParams(req.body);
    var rawImg = sharp(await Utils.getImageFromUrl(req.body.image));
    var rawImgInfo = await Utils.getImageInfo(rawImg);
    var focus = req.body.focus;
    if (focus.x > rawImgInfo.width || focus.y > rawImgInfo.height) {
      throw {
        code: 400,
        msg: "Focus image offset can not be located outside of the image",
      };
    } else if (
      focus.x + focus.width > rawImgInfo.width ||
      focus.y + focus.height > rawImgInfo.height
    ) {
      throw {
        code: 400,
        msg: "Focus image can not be located outside of the image",
      };
    }
    var requestedImage = {
      width: req.body.requested_size.w,
      height: Math.round(
        (req.body.requested_size.w / req.body.requested_size.ratio.x) *
          req.body.requested_size.ratio.y
      ),
      q: req.body.requested_size.q,
    };
    var adheredEdge = Utils.findAdheredEdge(rawImgInfo, focus);
    var resize = Utils.calculateResize(focus, requestedImage);
    var img = rawImg;
    if (resize.sizing) {
      img.resize(
        Math.round(rawImgInfo.width * resize.ratio),
        Math.round(rawImgInfo.height * resize.ratio)
      );
    }
    var imgInfo = await Utils.getImageInfo(img);
    var clones = Utils.calculateClone(imgInfo, requestedImage, adheredEdge);
    if (clones.cloning) {
      var clonedBuffer = await Utils.addAllPixelsLine(img, imgInfo, clones);
      img = sharp(clonedBuffer);
      imgInfo = await Utils.getImageInfo(img);
    }

    var cropData = Utils.calculateCropSize(
      imgInfo,
      requestedImage,
      adheredEdge,
      resize,
      focus
    );
    var uuid = uuidv4();

    img
      .extract(cropData)
      .jpeg({ quality: requestedImage.q })
      .toFile("./assets/" + uuid + ".jpg", (err, info) => {
        if (err) {
          res.status(500).json({ msg: "Image can not saved!!" });
        } else {
          res.status(200).json({
            msg: "Success",
            image_uuid: uuid,
            URL: req.protocol + "://" + req.get("host") + "/asset/" + uuid,
          });
        }
      });
  } catch (error) {
    if (error.code == undefined || error.code == null) {
      error.code = 500;
      error.msg = "Image can not generated!!!";
    }
    res.status(error.code).json({ msg: error.msg });
  }
};

/**
 * Handles undefined API paths.
 *
 * @param {Object} req
 * @param {ServerResponse} res
 * @return {ServerResponse}
 * @public
 */

exports.undefinedpath = function (req, res) {
  res.status(404).json({ msg: "Path not found" });
};

/**
 * Handles unavailable request methods.
 *
 * @param {Object} req
 * @param {ServerResponse} res
 * @return {ServerResponse}
 * @public
 */

exports.undefinedmethod = function (req, res) {
  res.status(404).json({ msg: "Method not allowed" });
};
