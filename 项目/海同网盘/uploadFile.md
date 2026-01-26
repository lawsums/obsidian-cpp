
上传文件的操作还是很有讲究的
uploadFile的功能其实是**上传文件头**, 主要告诉对方, 需要上传的文件的**目录路径**, 以及文件名和**文件大小**

1. 我们打开一个 [[QFileDialog]]::getOpenFileName() 用来获取需要上传的文件路径, 如果打开路径为空, 进行一个 QMessageBox: warning 的报错
2. 然后依然使用 lastIndexOf ('/') 的方法, 对**文件名**和**文件夹路径**进行分解, 通过 QFile file (文件名) , 去获取一个 QFile 文件, 调用 file.size()解析当前文件大小, 方便进行**分组传输**
3. 申请一片PDU的空间, PDU空间中, 我们把type设置为ENUM_MSG_TYPE_UPLOAD_FILE_REQUEST, 把路径作为pdu->caMsg传输回去, 为什么放在caMsg里, 是因为**如果路径太长, caData固定64字节不一定放得下**, 同时中文字节数不固定, 如果有中文路径还需要utf8处理
4. 最后发送回去, **释放pdu空间** , 同时让**定时器等待1秒**, ==防止文件头和文件数据产生混淆==
