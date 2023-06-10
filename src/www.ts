/*
 * @Author: cathylee 447932704@qq.com
 * @Date: 2023-05-17 22:12:34
 * @LastEditors: cathylee 447932704@qq.com
 * @LastEditTime: 2023-05-29 22:54:59
 * @FilePath: /loadFile/server/src/www.ts
 * @Description: 
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
 */
// 启动一个 http 服务

import app from "./app";
import http from "http";

const port = process.env.PORT||8000;

const server = http.createServer(app);

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

function onError(error: any) {
  console.error(error);
}
function onListening() {
  console.log("Listening on " + port);
}
