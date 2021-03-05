/*!
 * azerion-case
 * Copyright(c) 2021 Oktay Koçak
 * Do What The F*ck You Want To Public Licensed
 */

const axios = require("axios");
const { Buffer } = require("buffer");
const { URL } = require("url");
var sharp = require("sharp");
const { version: uuidVersion, validate: uuidValidate } = require("uuid");

/**
 * Validates request body.
 *
 * @param {Object} body
 * @return {Object}
 * @public
 */

exports.validateProcessParams = function (body) {
  var missingParams = [];
  var invalidParams = [];
  var response = {};

  if (body.image === undefined || body.image === null) {
    missingParams.push("image");
  } else {
    if (!stringIsAValidUrl(body.image)) {
      invalidParams.push("image must be a valid url");
    }
  }

  if (body.requested_size === undefined || body.requested_size === null) {
    missingParams.push("requested_size");
  } else {
    var keys = ["w", "ratio", "q"];
    var requestedSize = body.requested_size;
    keys.forEach((key) => {
      if (requestedSize[key] === undefined || requestedSize[key] === null) {
        missingParams.push(key + " in requested_size");
      } else if (key == "w" || key == "q") {
        if (typeof requestedSize[key] !== "number") {
          invalidParams.push(key + " in requested_size must be a number");
        } else if (requestedSize.w < 0) {
          invalidParams.push(key + " in requested_size must be an integer");
        }
      } else if (key == "ratio") {
        if (
          requestedSize.ratio.x === undefined ||
          requestedSize.ratio.x === null ||
          requestedSize.ratio.x === undefined ||
          requestedSize.ratio.x === null
        ) {
          missingParams.push("ratio in requested_size");
        } else if (
          typeof requestedSize.ratio.x !== "number" ||
          typeof requestedSize.ratio.y !== "number"
        ) {
          invalidParams.push("ratio values in requested_size must be a number");
        } else if (requestedSize.ratio.x <= 0 || requestedSize.ratio.y <= 0) {
          invalidParams.push(
            "ratio values in requested_size must be greather than zero"
          );
        }
      }
    });
  }

  if (body.focus === undefined || body.focus === null) {
    missingParams.push("focus");
  } else {
    var keys = ["x", "y", "width", "height"];
    var focus = body.focus;
    keys.forEach((key) => {
      if (focus[key] === undefined || focus[key] === null) {
        missingParams.push(key + " in focus");
      } else if (typeof focus[key] !== "number") {
        invalidParams.push(key + " in focus must be a number");
      } else if (focus[key] < 0) {
        invalidParams.push(key + " in focus must be an integer");
      }
    });
  }

  if (missingParams.length > 0) {
    response = {
      code: 400,
      msg: "Parameter(s) missing: " + missingParams.join(","),
    };
    throw response;
    // Check if we have any invaliddddd parameters
  } else if (invalidParams.length > 0) {
    response = {
      code: 400,
      msg: "Invalid Parameter(s): " + invalidParams.join(","),
    };
    throw response;
  }
};

/**
 * Return image data from url link.
 *
 * @param {string} url
 * @return {Promise}
 * @public
 */

exports.getImageFromUrl = async function (url) {
  return new Promise(function (resolve, reject) {
    axios
      .get(url, { responseType: "arraybuffer" })
      .then((res) => {
        resolve(Buffer.from(res.data, "binary"));
      })
      .catch((err) => {
        reject({ code: 500, msg: "Image can not downloaded!!!" });
      });
  });
};

/**
 * Return image info.
 *
 * @param {Object} img
 * @return {Promise}
 * @public
 */

exports.getImageInfo = function (img) {
  return new Promise(function (resolve, reject) {
    img
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        resolve(info);
      })
      .catch((err) => {
        reject({ code: 500, msg: "Can not get image info!!!" });
      });
  });
};

/**
 * Return resize ratio.
 *
 * @param {Object} focus
 * @param {Object} requestedImage
 * @return {object}
 * @public
 */

exports.calculateResize = function (focus, requestedImage) {
  var resize = {
    sizing: false,
    ratio: 1,
  };
  if (
    requestedImage.height >= focus.height &&
    requestedImage.width >= focus.width
  ) {
    return resize;
  } else {
    resize.sizing = true;
    var ratio = requestedImage.width / focus.width;
    if (ratio > requestedImage.height / focus.height) {
      ratio = requestedImage.height / focus.height;
    }
    resize.ratio = ratio;
  }
  return resize;
};

/**
 * Return clone data.
 *
 * @param {Object} imageSize
 * @param {Object} requestedImage
 * @param {Object} adheredEdge
 * @return {object}
 * @public
 */

exports.calculateClone = function (imageSize, requestedImage, adheredEdge) {
  var clonedStatus = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    cloning: false,
  };

  if (requestedImage.width > imageSize.width) {
    clonedStatus.cloning = true;
    var size = requestedImage.width - imageSize.width;
    if (
      (adheredEdge.left && adheredEdge.right) ||
      (!adheredEdge.left && !adheredEdge.right)
    ) {
      clonedStatus.left = Math.round(size / 2);
      clonedStatus.right = size - clonedStatus.left;
    } else {
      clonedStatus.left = adheredEdge.left ? 0 : size;
      clonedStatus.right = size - clonedStatus.left;
    }
  }

  if (requestedImage.height > imageSize.height) {
    clonedStatus.cloning = true;
    var size = requestedImage.height - imageSize.height;
    if (
      (adheredEdge.top && adheredEdge.bottom) ||
      (!adheredEdge.top && !adheredEdge.bottom)
    ) {
      clonedStatus.top = Math.round(size / 2);
      clonedStatus.bottom = size - clonedStatus.top;
    } else {
      clonedStatus.top = adheredEdge.top ? 0 : size;
      clonedStatus.bottom = size - clonedStatus.top;
    }
  }
  return clonedStatus;
};

/**
 * Return image buffer.
 *
 * @param {Object} img
 * @param {Object} imageSize
 * @param {Object} clonedStatus
 * @return {Promise}
 * @public
 */

exports.addAllPixelsLine = async function (img, imageSize, clonedStatus) {
  try {
    var backgroundData = {
      width: imageSize.width,
      height: imageSize.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    };

    var tempImgBuf = await img.toBuffer();
    if (clonedStatus.right > 0) {
      backgroundData.width += clonedStatus.right;
      tempImgBuf = await this.addPixelsLinetoEdge(
        tempImgBuf,
        await sharp(tempImgBuf)
          .extract({
            left: imageSize.width - 1,
            top: 0,
            width: 1,
            height: imageSize.height,
          })
          .toBuffer(),
        backgroundData,
        { left: 0, top: 0 }
      );
    }

    if (clonedStatus.left > 0) {
      backgroundData.width += clonedStatus.left;
      tempImgBuf = await this.addPixelsLinetoEdge(
        tempImgBuf,
        await sharp(tempImgBuf)
          .extract({
            left: 0,
            top: 0,
            width: 1,
            height: imageSize.height,
          })
          .toBuffer(),
        backgroundData,
        { left: clonedStatus.left, top: 0 }
      );
    }

    if (clonedStatus.bottom > 0) {
      backgroundData.height += clonedStatus.bottom;
      tempImgBuf = await this.addPixelsLinetoEdge(
        tempImgBuf,
        await sharp(tempImgBuf)
          .extract({
            left: 0,
            top: imageSize.height - 1,
            width: backgroundData.width,
            height: 1,
          })
          .toBuffer(),
        backgroundData,
        { left: 0, top: 0 }
      );
    }

    if (clonedStatus.top > 0) {
      backgroundData.height += clonedStatus.top;
      tempImgBuf = await this.addPixelsLinetoEdge(
        tempImgBuf,
        await sharp(tempImgBuf)
          .extract({
            left: 0,
            top: 0,
            width: backgroundData.width,
            height: 1,
          })
          .toBuffer(),
        backgroundData,
        { left: 0, top: clonedStatus.top }
      );
    }
    return tempImgBuf;
  } catch (error) {
    throw { code: 500, msg: "Clone operations is failed!" };
  }
};

/**
 * Return composited image.
 *
 * @param {Object} imgBuff
 * @param {Object} pixelsLine
 * @param {Object} backgroundData
 * @param {Object} offset
 * @return {Promise}
 * @public
 */

exports.addPixelsLinetoEdge = async function (
  imgBuff,
  pixelsLine,
  backgroundData,
  offset
) {
  var back = await sharp({
    create: backgroundData,
  })
    .composite([{ input: pixelsLine, tile: true }])
    .jpeg()
    .toBuffer();
  return await sharp(back)
    .composite([
      { input: imgBuff, tile: false, left: offset.left, top: offset.top },
    ])
    .jpeg()
    .toBuffer();
};

/**
 * Return croped size info.
 *
 * @param {Object} imageSize
 * @param {Object} requestedImage
 * @param {Object} adheredEdge
 * @param {Object} resize
 * @param {Object} focus
 * @return {Object}
 * @public
 */

exports.calculateCropSize = function (
  imageSize,
  requestedImage,
  adheredEdge,
  resize,
  focus
) {
  var cropData = {
    left: 0,
    top: 0,
    width: requestedImage.width,
    height: requestedImage.height,
  };

  if (imageSize.width > requestedImage.width) {
    if (adheredEdge.right) {
      cropData.left = imageSize.width - requestedImage.width;
    } else if (!adheredEdge.left) {
      var newX = Math.round(focus.x * resize.ratio);
      var newW = Math.round(focus.width * resize.ratio);
      cropData.left = newX - Math.round((requestedImage.width - newW) / 2);
    }
  }

  if (imageSize.height > requestedImage.height) {
    if (adheredEdge.bottom) {
      cropData.top = imageSize.height - requestedImage.height;
    } else if (!adheredEdge.top) {
      var newY = Math.round(focus.y * resize.ratio);
      var newH = Math.round(focus.height * resize.ratio);
      cropData.top = newY - Math.round((requestedImage.height - newH) / 2);
    }
  }

  return cropData;
};

/**
 * Return adhered edge info.
 *
 * @param {Object} rawImageSize
 * @param {Object} focus
 * @return {Object}
 * @public
 */

exports.findAdheredEdge = function (rawImageSize, focus) {
  var adheredEdge = {
    left: focus.x == 0,
    right: rawImageSize.width == focus.x + focus.width,
    top: focus.y == 0,
    bottom: rawImageSize.height == focus.y + focus.height,
  };
  return adheredEdge;
};

/**
 * Validate uuid
 *
 * @param {uuid} uuid
 * @return {boolean}
 * @public
 */

exports.validateUUID = function (uuid) {
  return uuidValidate(uuid) && uuidVersion(uuid) === 4;
};

/**
 * Validate url
 *
 * @param {string} s
 * @return {boolean}
 * @public
 */

const stringIsAValidUrl = (s, protocols) => {
  try {
    url = new URL(s);
    return protocols
      ? url.protocol
        ? protocols.map((x) => `${x.toLowerCase()}:`).includes(url.protocol)
        : false
      : true;
  } catch (err) {
    return false;
  }
};
