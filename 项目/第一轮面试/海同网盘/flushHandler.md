这个函数接口很简单, 只要传入要刷新的文件夹路径即可
```cpp
void Book::flushHandler(QString strCurPath) {
    PDU *pdu = mkPDU(strCurPath.size() + 1);
    pdu->uiMsgType = ENUM_MSG_TYPE_FLUSH_FILE_REQUEST;
    strncpy((char *) (pdu->caMsg), strCurPath.toStdString().c_str(), strCurPath.size());

    TcpClient::getInstance().getTcpSocket().write((char *) pdu, pdu->uiPDULen);
    free(pdu);
    pdu = NULL;
}
```
