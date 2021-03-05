# Azerion Case

### Installation

Install dependencies

```bash
$ npm install
```

### Config

Available environment variables are

`PORT`  
(default: 3000)

### Testing

Project uses [JEST](https://jestjs.io) for testing.

To start unit tests

```bash
$ npm run test
```

### API Routes

Host: `https://localhost:3000/`

`POST /process`

| Parameters     | Type   | Description                | Optional |
| -------------- | ------ | -------------------------- | -------- |
| focus          | Object | Focus area info            | no       |
| image          | String | Base image URL             | no       |
| requested_size | Object | Requested image dimensions | no       |

| Parameters | Type   | Description          | Optional |
| ---------- | ------ | -------------------- | -------- |
| x          | Number | Focus area left edge | no       |
| y          | Number | Focus area top edge  | no       |
| width      | Number | Focus area width     | no       |
| height     | Number | Focus area height    | no       |

| Parameters | Type   | Description                            | Optional |
| ---------- | ------ | -------------------------------------- | -------- |
| w          | Number | Requested image width                  | no       |
| ratio      | Number | Requested image aspect ratio           | no       |
| q          | Number | Requested image JPEG quality (e.g. 60) | no       |

#### Request Body

```jsx
Content-Type: application/json
{
	"focus":{ "x": 1500, "y": 130, "width": 2180, "height": 1280 },
	"image":"https://media.huz.byorbit.com/asset/c5ba1d98-7baa-46d1-a363-60088b7b81ea/",
	"requested_size":{ "w": 5500, "ratio": { "x": 16, "y": 3}, "q": 60}
}
```

#### Response Payload

```jsx
{
  "msg": "Success",
  "image_uuid": "a0f34764-8f68-473c-a7d4-e117faf286b5",
  "URL": "http://localhost:3000/asset/a0f34764-8f68-473c-a7d4-e117faf286b5"
}
```

`GET /asset/189d2614-5190-4fbb-8772-d2e9e5200f0e`

### License

[WTFPL](LICENSE.md)
