
- [ ] 实现 ip 地址处理器 address_resolver
- [ ] 实现检错函数
	- [x] 实现 check_error
	- [x] 用宏封装 `#define CHECK_CALL(func, ...) check_error(#func, func(__VA_ARGS__))`
- [x] 进一步封装
- [ ] 使用多线程 thread 隔离
	- [x] accept 新的客户端
	- [ ] read/write 读写操作