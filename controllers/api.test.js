/*!
 * azerion-case
 * Copyright(c) 2021 Oktay Koçak
 * Do What The F*ck You Want To Public Licensed
 */

const supertest = require("supertest");
const app = require("../app");
const request = supertest(app);

describe("image processer", () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

  it("Successful request => Should respond with 200", () => {
    return request
      .post("/process")
      .send({
        focus: { x: 1500, y: 130, width: 2180, height: 1280 },
        image:
          "https://media.huz.byorbit.com/asset/c5ba1d98-7baa-46d1-a363-60088b7b81ea/",
        requested_size: { w: 5500, ratio: { x: 16, y: 3 }, q: 60 },
      })
      .then((res) => {
        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toEqual("Success");
      });
  });

  let img_uuid = "189d2614-5190-4fbb-8772-d2e9e5200f0e";
  it("Successful request => Should respond with 200", () => {
    return request.get("/asset/" + img_uuid).then((res) => {
      expect(res.statusCode).toEqual(200);
    });
  });

  it("Missing body request => Should respond with 400", () => {
    return request
      .post("/process")
      .send(null)
      .then((res) => {
        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toEqual(
          "Parameter(s) missing: image,requested_size,focus"
        );
      });
  });

  it("Invalid parameters => Should respond with 400", () => {
    return request
      .post("/process")
      .send({
        focus: { x: -5600, y: 130, width: 2180, height: 1280 },
        image:
          "https://media.huz.byorbit.com/asset/c5ba1d98-7baa-46d1-a363-60088b7b81ea/",
        requested_size: { w: 5500, ratio: { x: 16, y: 3 }, q: 60 },
      })
      .then((res) => {
        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toEqual(
          "Invalid Parameter(s): x in focus must be an integer"
        );
      });
  });

  it("Illogical request parameters  => Should respond with 400", () => {
    return request
      .post("/process")
      .send({
        focus: { x: 5600, y: 130, width: 2180, height: 1280 },
        image:
          "https://media.huz.byorbit.com/asset/c5ba1d98-7baa-46d1-a363-60088b7b81ea/",
        requested_size: { w: 5500, ratio: { x: 16, y: 3 }, q: 60 },
      })
      .then((res) => {
        expect(res.statusCode).toEqual(400);
        expect(res.body.msg).toEqual(
          "Focus image offset can not be located outside of the image"
        );
      });
  });

  it("Method not allowed => Should respond with 404", () => {
    return request
      .get("/process")
      .send({
        focus: { x: 1500, y: 130, width: 2180, height: 1280 },
        image:
          "https://media.huz.byorbit.com/asset/c5ba1d98-7baa-46d1-a363-60088b7b81ea/",
        requested_size: { w: 5500, ratio: { x: 16, y: 3 }, q: 60 },
      })
      .then((res) => {
        expect(res.statusCode).toEqual(404);
        expect(res.body.msg).toEqual("Method not allowed");
      });
  });

  it("Path not found => Should respond with 404", () => {
    return request
      .get("/some-path")
      .send({
        focus: { x: 1500, y: 130, width: 2180, height: 1280 },
        image:
          "https://media.huz.byorbit.com/asset/c5ba1d98-7baa-46d1-a363-60088b7b81ea/",
        requested_size: { w: 5500, ratio: { x: 16, y: 3 }, q: 60 },
      })
      .then((res) => {
        expect(res.statusCode).toEqual(404);
        expect(res.body.msg).toEqual("Path not found");
      });
  });
});
