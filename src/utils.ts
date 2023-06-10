/*
 * @Author: cathylee 447932704@qq.com
 * @Date: 2023-05-17 22:12:00
 * @LastEditors: cathylee 447932704@qq.com
 * @LastEditTime: 2023-06-06 22:14:38
 * @FilePath: /loadFile/server/src/utils.ts
 * @Description:
 *
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved.
 */
import fs, { WriteStream } from "fs-extra";

import path from "path";
const DEFAULT_SIZE = 1024 * 1024 * 50; // 50M

export const PUBLIC_DIR = path.resolve(__dirname, "public");
export const TEMP_DIR = path.resolve(__dirname, "temp");

// 后端分片方法 分割buffer
export const splitChunks = async (
    filename: string,
    size: number=DEFAULT_SIZE
)=>{
    const filePath = path.resolve(__dirname, filename);// 待切割的文件的绝对路径
    const chunkDir = path.resolve(TEMP_DIR, filename);// 切割后的文件的存储目录
    await fs.mkdirp(chunkDir);// 创建存储目录
    const content = await fs.readFile(filePath);// 读取待切割的文件
    let i = 0;
    let current = 0;
    let len = content.length;
    while(current < len){
        await fs.writeFile(
            path.resolve(chunkDir, filename + "-" + i),
            content.slice(current, current + size)
        );
        i++;
        current += size;
    }
}


const pipeStream = (path: string, writeStream: WriteStream) => {
    new Promise((resolve) => {
        let rs = fs.createReadStream(path);
        rs.on("end", async () => {
            await fs.unlink(path);
            resolve("");
        })
        rs.pipe(writeStream);
    })
}

// 合并文件
/**
 * 1.读取temp目录下的所有文件
 * 2.按照文件名进行排序
 * 3.创建一个可写流
 * 4.把每个文件创建一个可读流，然后依次写入可写流中
 * 5.写入完成后，删除temp目录
 * 
 */

export const mergeChunks = async (
    filename: string,
    size: number=DEFAULT_SIZE
)=>{
    const filePath = path.resolve(PUBLIC_DIR, filename);// 合并后的文件的绝对路径
    const chunkDir = path.resolve(TEMP_DIR, filename);// 切割后的文件的存储目录
    const chunkFiles = await fs.readdir(chunkDir);// 读取切割后的文件
    chunkFiles.sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));// 按照文件名进行排序
    await Promise.all(
        chunkFiles.map((chunkFile: string, index: number) => {
            pipeStream(
                path.resolve(chunkDir, chunkFile),
                fs.createWriteStream(filePath, {
                    start: index * size,
                })
            )
        })
    )
}