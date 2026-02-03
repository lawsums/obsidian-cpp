#include "mainwindow.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainWindow w;

    //改变窗口背景颜色
//    w.setStyleSheet("background-color: cyan");
    w.show();
    return a.exec();
}
