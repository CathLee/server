import express, { Request, Response } from "express";
import logger from "morgan";
import path from "path";
import cors from "cors";

import fs from "fs-extra";

import { PUBLIC_DIR, TEMP_DIR,mergeChunks } from "./utils";
const app = express();
app.use(express.json());
app.use(logger("dev"));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); //静态文件中间件
app.use(cors());

// 校验已经上传的文件
app.get('/verify/:filename', async (req: Request, res: Response) => {
  let {filename} = req.params;
  let filePath = path.resolve(PUBLIC_DIR, filename);
  let existFile = await fs.pathExists(filePath);
  if(existFile){
    // 已经上传过了，不再需要上传了，可以实现秒传
    res.json({
      //返回json数据
      success: true,
      needUpload: false,
    });
  }

  let tempDir = path.resolve(TEMP_DIR, filename);
  let exist = await fs.pathExists(tempDir);
  let uploadList: any[] = [];
  if(exist){
    uploadList = await fs.readdir(tempDir);
    uploadList = await Promise.all(uploadList.map(async (filename: string) => {
      let stat = await fs.stat(path.resolve(tempDir, filename));
      return {
        filename,
        size: stat.size, // 现在的文件大小
      }
    }))
  }
  return res.json({
    success: true,
    needUpload: true,
    uploadList, // 已经上传的文件列表

  })

})
app.post(
  "/upload/:filename/:chunk_name/:start",
  async (req: Request, res: Response) => {
    const { filename, chunk_name} = req.params;
    let start = Number(req.params.start);    
    let chunk_dir = path.resolve(TEMP_DIR, filename);
    let exist = await fs.pathExists(chunk_dir);
    if(!exist){
      // 若不存在分片存储目录，则创建
      await fs.mkdir(chunk_dir);
    }
    // 读取请求体中的chunk数据，写入到对应的文件中
    let chunkFilePath = path.resolve(chunk_dir, chunk_name);
    // flags: 'a'--append 追加写入,即断点续传
    let ws = fs.createWriteStream(chunkFilePath, {start, flags: 'a'});
    // 
    req.on('end', () => {
      ws.close();
      res.end('ok');
    })
  }
);

// 对上传的文件进行合并
app.post('/merge/:filename', async (req: Request, res: Response) => {
  let {filename} = req.params;
  await mergeChunks(filename);
  res.json({success: true});
})



export default app;
