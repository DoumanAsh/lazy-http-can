# lazy-http-can

Simple HTTP testing service.

Done just for the sake of exploring [koa](http://koajs.com/) framework.

# Endpoints

## [/](/)

Index of service.

Returns rendered HTML from this README

## [/mirror](mirror/)

Mirror back request.

Reponse will contain JSON with following fields:
- headers - JSON with all request's headers.
- params - URI params from request.
- payload - Body of request.
    - type - Content-Type that were used to parse request's body.
        - If text then data will be parsed as utf-8 String.
        - If json then data will be parsed as JSON.
        - If xml then data will be parsed as utf-8 String.
        - If x-www-form-urlencoded data will be parsed as URI params.
        - Otherwise it is array of bytes.
    - data - Content of body. Type depends on Content-Type.

## [/status/:code](status/200)

Response back with provided code.

Code should be a valid number and positive integer.

Otherwise error response is sent.

## [/bytes/:num](bytes/1000)

Generates back response with stream of bytes.

Num should be a valid number and positive integer.

Otherwise error response is sent.

## [/headers](headers)

Response back with request's headers

## [/header/:header](header/host)

Response back with a specific header of request.

If not present, empty JSON is returned.

## [/response/:type](response/body?key=val)

Response back with data from URI params

Possible type:
- headers - URI params will be sent back in response's headers
- body - URI params will be sent back in response's body.
- all - Above mentioned together.

## [/unicode/:type](unicode/text)

Response back with unicode data.

Possible type:
- text - Data is sent as text.
- bytes - Data is sent as bytes.
- stream - Data is sent as stream of bytes.

## [/delay/:ms](delay/3000)

Response is sent with delay in milliseconds.

Obviously delay must be a valid positive number.

# Run it locally

```
npm install --production
npm start
```

### Environment variables.

* **NODE_PORT** - Port for use. If not specified port 3333 is used.
