#include "mainwindow.h"
#include "ui_mainwindow.h"

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    // 固定窗口尺寸大小
    setFixedSize(this->width(),this->height());

    // 禁止:添加员工记录,删除员工记录,修改员工记录,查找员工记录:四个功能
    ui->pushButton_Add->setEnabled(false);
    ui->pushButton_Del->setEnabled(false);
    ui->pushButton_Modify->setEnabled(false);
    ui->pushButton_Search->setEnabled(false);

    // 用户只能选择整行数据而不是单个单元格
    ui->tableView_DisplayDate->setSelectionBehavior(QAbstractItemView::SelectRows);

    // SingleSelection意味着用户每次只能选择一个项目,即一行
    ui->tableView_DisplayDate->setSelectionMode(QAbstractItemView::SingleSelection);

    //
    ui->tableView_DisplayDate->setAlternatingRowColors(true);
}

MainWindow::~MainWindow()
{
    delete ui;
}

// 打开数据表
void MainWindow::OpenDataTableFunc()
{
    QMessageBox::information(this,"OK","系统提示:OK? ",QMessageBox::Yes,QMessageBox::NoButton);

    //创建一个QSqlQueryModel实例,用于从数据库里获取数据
    QueryModel = new QSqlQueryModel(this);

    //创建一个QItemSelectionModel实例,用于管理用户的选择
    TheSelectModel = new QItemSelectionModel(QueryModel);
    // /////////////////////////////////////////////////////////////////////////////////
    //通过setQuery方法执行SQL查询,查询EmployeeTables表中的员工信息,并按照empNumber排序

    QueryModel->setQuery("select empNumber,empName,empSex,empHeight,empBirthday,empTelephone,"
                         "empProvince,empCity,empDepartment,empEducation,"
                         "empSalary,empPhoto,empRemarks"
                         " from EmployeeTables order by empNumber",DbObject);

    //',DbObject'很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要
    // ////////////////////////////////////////////////////////////////////////////

    //empNumber	empName	empSex	empHeight	empBirthday	empTelephone	empProvince	empCity	empDepartment	empEducation	empSalary

    //判断查询是否成功
    if(QueryModel->lastError().isValid())
    {
        QMessageBox::critical(this,"错误","系统提示:数据表查询失败,错误信息: \n"+QueryModel->lastError().text());
        return;
    }

    //设置表头数据
    QueryModel->setHeaderData(0,Qt::Horizontal,"员工编号");
    QueryModel->setHeaderData(1,Qt::Horizontal,"员工姓名");
    QueryModel->setHeaderData(2,Qt::Horizontal,"员工性别");
    QueryModel->setHeaderData(3,Qt::Horizontal,"员工身高");
    QueryModel->setHeaderData(4,Qt::Horizontal,"员工日期");
    QueryModel->setHeaderData(5,Qt::Horizontal,"联系电话");
    QueryModel->setHeaderData(6,Qt::Horizontal,"所在省份");
    QueryModel->setHeaderData(7,Qt::Horizontal,"所在城市");
    QueryModel->setHeaderData(8,Qt::Horizontal,"所在部门");
    QueryModel->setHeaderData(9,Qt::Horizontal,"最高学历");
    QueryModel->setHeaderData(10,Qt::Horizontal,"基本工资");

    //
    ui->tableView_DisplayDate->setModel(QueryModel);
    ui->tableView_DisplayDate->setSelectionModel(TheSelectModel);

    // 启用:添加员工记录,删除员工记录,修改员工记录,查找员工记录:四个功能
    ui->pushButton_Add->setEnabled(true);
    ui->pushButton_Del->setEnabled(true);
    ui->pushButton_Modify->setEnabled(true);
    ui->pushButton_Search->setEnabled(true);


}


void MainWindow::UpdateRecordInfoFunc(int RecordNumber)
{
    QMessageBox::information(NULL,"提示","系统提示：程序已经执行到此处！！！",QMessageBox::Ok,QMessageBox::NoButton);

    // 获取QueryModel中指定索引处的记录
    QSqlRecord SQLCurrentRecord = QueryModel->record(RecordNumber);


    // 从记录中获取员工编号
    int iEmpNumber = SQLCurrentRecord.value("empNumber").toInt();

    // 创建QSQLQuery对象,通过编号进行查询修改
    QSqlQuery SQLQuery(DbObject);

    // 设置准备执行的SQL语句,一般用于带参数的SQL语句,提高安全性
    SQLQuery.prepare("select *from EmployeeTables where empNumber=:ID");

    // 将参数:ID绑定到员工编号iEmpNumber
    SQLQuery.bindValue(":ID",iEmpNumber);

    // 执行SQL语句
    SQLQuery.exec();

    // 移动到查询到的第一条语句
    SQLQuery.first();

    // 如果没找到则返回
    if(!SQLQuery.isValid())
    {
        return;
    }

    // 更新SQLCurrentRecord为查询结果的记录
    SQLCurrentRecord = SQLQuery.record();

    // 把查询到的记录映射回addmodifydialog中,然后进行修改
    // 调用添加修改对话框
    addmodifyDialog *imdlg=new addmodifyDialog(this);
    Qt::WindowFlags flgs=imdlg->windowFlags();

    // 固定窗口大小
    imdlg->setWindowFlags(flgs | Qt::MSWindowsFixedSizeDialogHint);

    // 调用对话框,使用当前记录的数据初始化对话框,并更新界面
    imdlg->setUpdateRecordFunc(SQLCurrentRecord);


    // 以模态形式显示对话框(关键点在于"imdlg->exec()")
    int iResult = imdlg->exec();

    // OK键按下执行{}里面的代码
    if(iResult==QDialog::Accepted)
    {
        // 获取修改员工记录(来自addmodifydialog对话框)
        QSqlRecord recData = imdlg->getRecordDataFunc();

        SQLQuery.prepare("update EmployeeTables set empName=:empName,empSex=:empSex,empHeight=:empHeight,"
                         "empBirthday=:empBirthday,empTelephone=:empTelephone,empProvince=:empProvince,"
                         "empCity=:empCity,empDepartment=:empDepartment,empEducation=:empEducation,"
                         "empSalary=:empSalary,empRemarks=:empRemarks,empPhoto=:empPhoto"
                         " where empNumber =:ID");

        SQLQuery.bindValue(":ID",recData.value("empNumber"));
        SQLQuery.bindValue(":empName",recData.value("empName"));
        SQLQuery.bindValue(":empSex",recData.value("empSex"));
        SQLQuery.bindValue(":empHeight",recData.value("empHeight"));
        SQLQuery.bindValue(":empBirthday",recData.value("empBirthday"));
        SQLQuery.bindValue(":empTelephone",recData.value("empTelephone"));
        SQLQuery.bindValue(":empProvince",recData.value("empProvince"));
        SQLQuery.bindValue(":empCity",recData.value("empCity"));
        SQLQuery.bindValue(":empDepartment",recData.value("empDepartment"));
        SQLQuery.bindValue(":empEducation",recData.value("empEducation"));
        SQLQuery.bindValue(":empSalary",recData.value("empSalary"));
        SQLQuery.bindValue(":empRemarks",recData.value("empRemarks"));
        SQLQuery.bindValue(":empPhoto",recData.value("empPhoto"));

        if(!SQLQuery.exec())
        {
            QMessageBox::critical(this,"错误","系统提示:修改员工记录信息错误,请重新检查\n"+SQLQuery.lastError().text(),QMessageBox::Ok,QMessageBox::NoButton);

        }
        else
        {
            // 数据模型重新查询数据
            QueryModel->query().exec();
            QueryModel->setQuery("select empNumber,empName,empSex,empHeight,empBirthday"
                                 ",empTelephone,empProvince,empCity,empDepartment,empEducation,empSalary,empRemarks,empPhoto"
                                 " from EmployeeTables order by empNumber",DbObject);
        }

    }

    delete imdlg; // 添加员工记录成功后,删除对话框
}


void MainWindow::on_pushButton_Initial_clicked()
{
    // 使用文件对话框让用户选择数据库
    QString strFile = QFileDialog::getOpenFileName(this, "请选择 SQLite数据库", "", "SQLite3数据库 (*.db *.db3)");

    // 如果用户取消选择或者没有选择数据库文件,strFile字符串则为空
    if (strFile.isEmpty())
    {
        QMessageBox::critical(this, "错误1", "系统提示：打开SQLite数据库失败，请重新检查？", QMessageBox::Ok, QMessageBox::NoButton);
        return;
    }

    // 检查是否已经有数据库连接
    if (QSqlDatabase::contains("myConnection")) {
        DbObject = QSqlDatabase::database("myConnection");
    } else {
        // 创建一个新QSQLITE数据库连接
        DbObject = QSqlDatabase::addDatabase("QSQLITE", "myConnection");
    }

    // 设置数据库文件路径
    DbObject.setDatabaseName(strFile);

    // 尝试打开数据库连接
    if (!DbObject.open())
    {
        QMessageBox::critical(this, "错误2", "系统提示：打开SQLite数据库失败，请重新检查？" + DbObject.lastError().text(), QMessageBox::Ok, QMessageBox::NoButton);
        return;
    }

    // 如果数据库打开成功,调用OpenDataTableFunc函数打开数据表
    OpenDataTableFunc();

//    QSqlQuery sql_query(QSqlDatabase);
}

void MainWindow::on_pushButton_Add_clicked()
{
    // 插入记录
    QSqlQuery SQLQuery(DbObject);
    //"(DbObject)"很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要很重要

    SQLQuery.exec("select *from EmployeeTables where empNumber=-1");

    QSqlRecord CurrentRecord=SQLQuery.record();

    CurrentRecord.setValue("empNumber",QueryModel->rowCount()+2014);



    // 调用添加员工记录对话框
    addmodifyDialog *imdlg=new addmodifyDialog(this);
    Qt::WindowFlags flgs=imdlg->windowFlags();

    // 固定窗口大小
    imdlg->setWindowFlags(flgs | Qt::MSWindowsFixedSizeDialogHint);

    // 调用添加对话框自定义函数
    imdlg->setInsertRecordFunc(CurrentRecord);

    // 以模态形式显示对话框
    int iResult = imdlg->exec();

    // OK键按下执行{}里面的代码
    if(iResult==QDialog::Accepted)
    {
        QMessageBox::information(this,"提示","系统提示001",QMessageBox::Yes);

        // 获取添加员工记录(来自addmodifydialog对话框)
        QSqlRecord recData = imdlg->getRecordDataFunc();

        SQLQuery.prepare("insert into EmployeeTables(empNumber,empName,empSex,empHeight,empBirthday,empTelephone,empProvince,empCity,empDepartment,empEducation,empSalary,empRemarks,empPhoto)"
                         "values(:empNumber,:empName,:empSex,:empHeight,:empBirthday,:empTelephone,:empProvince,:empCity,:empDepartment,:empEducation,:empSalary,:empRemarks,:empPhoto)");


        SQLQuery.bindValue(":empNumber",recData.value("empNumber"));
        SQLQuery.bindValue(":empName",recData.value("empName"));
        SQLQuery.bindValue(":empSex",recData.value("empSex"));
        SQLQuery.bindValue(":empHeight",recData.value("empHeight"));
        SQLQuery.bindValue(":empBirthday",recData.value("empBirthday"));
        SQLQuery.bindValue(":empTelephone",recData.value("empTelephone"));
        SQLQuery.bindValue(":empProvince",recData.value("empProvince"));
        SQLQuery.bindValue(":empCity",recData.value("empCity"));
        SQLQuery.bindValue(":empDepartment",recData.value("empDepartment"));
        SQLQuery.bindValue(":empEducation",recData.value("empEducation"));
        SQLQuery.bindValue(":empSalary",recData.value("empSalary"));
        SQLQuery.bindValue(":empRemarks",recData.value("empRemarks"));
        SQLQuery.bindValue(":empPhoto",recData.value("empPhoto"));

        if(!SQLQuery.exec())
        {
            QMessageBox::critical(this,"错误","系统提示:添加员工记录信息错误,请重新检查\n"+SQLQuery.lastError().text(),QMessageBox::Ok,QMessageBox::NoButton);

        }
        else
        {
            // 数据模型重新查询数据
            QueryModel->query().exec();
            QueryModel->setQuery("select empNumber,empName,empSex,empHeight,empBirthday"
                                 ",empTelephone,empProvince,empCity,empDepartment,empEducation,empSalary,empRemarks,empPhoto"
                                 " from EmployeeTables order by empNumber",DbObject);
        }

    }

    delete imdlg; // 添加员工记录成功后,删除对话框

}

void MainWindow::on_pushButton_Del_clicked()
{
    // 获取当前选中的记录编号, 基于选择模型TheSelectMode
    int iCurrentRecordNumber = TheSelectModel->currentIndex().row();

    // 根据记录编号获取当前选中的记录
    QSqlRecord CurrentRecord = QueryModel->record(iCurrentRecordNumber);


    // 如果当前记录为空
    if(CurrentRecord.isEmpty())
    {
        return;
    }


    // 从当前记录中获取编号
    int iEmpNumber = CurrentRecord.value("empNumber").toInt();

    // 根据编号进行删除
    QSqlQuery query(DbObject);
    query.prepare("delete from EmployeeTables where empNumber=:ID");
    query.bindValue(":ID",iEmpNumber); //绑定数据

    // 执行删除语句
    if(!query.exec())
    {
        QMessageBox::critical(this,"错误","系统提示:删除员工记录执行失败,请重新检查\n"+query.lastError().text(),QMessageBox::Ok,QMessageBox::NoButton);
    }
    else
    {
        // 如果执行成功,数据模型重新查询数据
        QueryModel->query().exec();
        QueryModel->setQuery("select empNumber,empName,empSex,empHeight,empBirthday"
                             ",empTelephone,empProvince,empCity,empDepartment,empEducation,empSalary,empRemarks,empPhoto"
                             " from EmployeeTables order by empNumber",DbObject);

    }


}


void MainWindow::on_pushButton_Modify_clicked()
{
    // 获取当前选中员工的记录编号
    int iCurrentRecordNumber = TheSelectModel->currentIndex().row();

    // 调用函数,传入当前选中员工记录编号
    UpdateRecordInfoFunc(iCurrentRecordNumber);

}

void MainWindow::on_pushButton_Search_clicked()
{

}

void MainWindow::on_pushButton_Exit_clicked()
{
    this->close();
}
