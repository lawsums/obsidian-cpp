#include "addmodifydialog.h"
#include "ui_addmodifydialog.h"

addmodifyDialog::addmodifyDialog(QWidget *parent) :
    //构造函数
    QDialog(parent),
    ui(new Ui::addmodifyDialog)
{
    ui->setupUi(this);

    QPushButton *buttonOk = ui->buttonBoxOkorCancel->button(QDialogButtonBox::Ok);
    buttonOk->setText("确认操作");
    QPushButton *buttonCancel = ui->buttonBoxOkorCancel->button(QDialogButtonBox::Cancel);
    buttonCancel->setText("撤销操作");

    QIcon okIco(":/new/prefix1/images/ok.ico");
    buttonOk->setIcon(okIco);
    //buttonOk->setFixedSize(QSize(100,30));

    QIcon cancelIco(":/new/prefix1/images/cancel.ico");
    buttonCancel->setIcon(cancelIco);

}

addmodifyDialog::~addmodifyDialog()
    //构析函数
{
    delete ui;
}

void addmodifyDialog::setInsertRecordFunc(QSqlRecord &RecordData) //添加员工记录函数
{
    // 插入员工数据,不需要新界面显示,但是要存储RecordData
    mRecord = RecordData;

    ui->spinEmpNo->setEnabled(true);

    setWindowTitle("员工信息管理系统--添加员工记录 V1.0");

    ui->spinEmpNo->setValue(RecordData.value("empNumber").toInt());

}

QSqlRecord addmodifyDialog::getRecordDataFunc() // 获取用户添加员工记录数据
{
    // 当用户单机OK按钮后,界面的数据就会保存到记录mRecord
    mRecord.setValue("empNumber",ui->spinEmpNo->value());
    mRecord.setValue("empName",ui->editName->text());
    mRecord.setValue("empSex",ui->comboSex->currentText());
    mRecord.setValue("empHeight",ui->SpinHeight->value());
    mRecord.setValue("empBirthday",ui->editBirth->text());
    mRecord.setValue("empTelephone",ui->editMod->text());
    mRecord.setValue("empProvince",ui->comboProvince->currentText());
    mRecord.setValue("empCity",ui->editCity->text());
    mRecord.setValue("empDepartment",ui->comboDep->currentText());
    mRecord.setValue("empEducation",ui->comboStudy->currentText());
    mRecord.setValue("empSalary",ui->spinWeath->value());
    mRecord.setValue("empRemarks",ui->lineEditText->text());

    // 照片编辑时已经修改mRecord的值
    //    mRecord.setValue("empPhoto",ui->SpinHeight->value());

    return mRecord; // 以记录作为返回值
}

void addmodifyDialog::setUpdateRecordFunc(QSqlRecord &RecordData)
{
    // 将传入的QSqlRecord对象赋值给mRecord,用于后续操作
    mRecord = RecordData;


    ui->spinEmpNo->setEnabled(false);

    setWindowTitle("员工信息管理系统--修改员工记录 V1.0");

    // 根据传入的QSqlRecord对象RecordData更新界面显示的数据
    // 假设ui中定义了相应的控件用于显示员工信息
    ui->spinEmpNo->setValue(mRecord.value("empNumber").toInt());
    ui->editName->setText(mRecord.value("empName").toString());
    ui->comboSex->setCurrentText(mRecord.value("empSex").toString());
    ui->SpinHeight->setValue(mRecord.value("empHeight").toFloat());
    ui->editBirth->setDate(mRecord.value("empBirthday").toDate());
    ui->editMod->setText(mRecord.value("empTelephone").toString());
    ui->comboProvince->setCurrentText(mRecord.value("empProvince").toString());
    ui->editCity->setText(mRecord.value("empCity").toString());
    ui->comboDep->setCurrentText(mRecord.value("empDepartment").toString());
    ui->comboStudy->setCurrentText(mRecord.value("empEducation").toString());
    ui->spinWeath->setValue(mRecord.value("empSalary").toInt());
    ui->lineEditText->setText(mRecord.value("empRemarks").toString());

    // 照片要单独处理
    QVariant qVa = RecordData.value("empPhoto");

    if (!qVa.isValid()) // 则清除显示的图片
    {
        ui->labelPhoto->clear();
    }
    else
    {
        QByteArray data = qVa.toByteArray();
        QPixmap pic;
        pic.loadFromData(data);

        ui->labelPhoto->setPixmap(pic.scaledToWidth(ui->labelPhoto->size().width()));
    }
}

void addmodifyDialog::on_pushButtonAddPhoto_clicked()
{
    QString  strFileName = QFileDialog::getOpenFileName(this,"请选择员工照片","","员工照片(*.jpg *.jpeg *.bmp)");

    if(strFileName.isEmpty())
        return;

    QByteArray byteData;
    QFile *qFile = new QFile(strFileName);
    qFile->open(QIODevice::ReadOnly);       //设置为只读
    byteData = qFile->readAll();
    qFile->close();

    mRecord.setValue("empPhoto",byteData);  //保存照片
    QPixmap pics;
    pics.loadFromData(byteData);
    ui->labelPhoto->setPixmap(pics.scaledToWidth(ui->labelPhoto->size().width()));

}

void addmodifyDialog::on_pushButtonDelPhoto_clicked()
{

}
