
[Rust 嵌入式开发 - STM32 从零创建项目_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV19UpozxEy4/?spm_id_from=333.337.search-card.all.click&vd_source=cf6228c0b4a5c283905e22fd11934994)


# 1 笔记
### 1.1.1 下载 stlink 仓库
[stlink-org/stlink：开源的 STM32 微控制器编程工具集 --- stlink-org/stlink: Open source STM32 MCU programming toolset](https://github.com/stlink-org/stlink)
刚下载完 ST-Link 仓库之后还不能使用，我们还需要下载一个动态链接库。
[libusb](https://libusb.info/)

### 1.1.2 创建新项目，并配置
[stm32f1xx-hal - crates.io: Rust Package Registry](https://crates.io/crates/stm32f1xx-hal)
创建新项目之后，要配置一下它的 TOML，这个就需要去找一个 Rust 上的 STM32F1 示例。

```ini
[target.thumbv7m-none-eabi]
runner = 'probe-rs run --chip STM32F103C8Tx'
rustflags = [
  "-C", "link-arg=-Tlink.x",
  "-C", "link-arg=-Tdefmt.x",
]

[build]
target = "thumbv7m-none-eabi"

[env]
DEFMT_LOG = "info"
```

然后是它的这个链接脚本，链接脚本在这里叫 `memory.x`。
```css
/* Linker script for the STM32F103C8T6 */
MEMORY
{
  FLASH : ORIGIN = 0x08000000, LENGTH = 64K
  RAM : ORIGIN = 0x20000000, LENGTH = 20K
}
```


然后我们初步编辑这个初始文件，`main.rs`
```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _; // you can put a breakpoint on `rust_begin_unwind` to catch panics

use hal::prelude::*;
use stm32f1xx_hal as hal;

#[entry]
fn main() -> ! {
    println!("Hello, world!");
    loop {}
}

```

进行 cargo build 时发现第一个错误：no device feature selected。
这是因为我们下载的包是 STM 32 F1XX，而 F1XX 包含很多型号，但我们没有指定具体的型号，所以导致报错。

我们修改这个 cargo.toml，变成如下形式
```toml
[package]
name = "hello-stm32-rust"
version = "0.1.0"
edition = "2024"

[dependencies]
cortex-m-rt = "0.7.6"
panic-halt = "1.0.0"
stm32f1xx-hal = { version = "0.11.0", features = ["stm32f103", "medium"] }

```


### 1.1.3 额外错误

#### 1.1.3.1 BUG 1
```vbnet
PS G:\Code\Embedded\Stm32\hello-stm32-rust> cargo build
    Blocking waiting for file lock on build directory
   Compiling nb v1.1.0
   Compiling vcell v0.1.3
   Compiling stable_deref_trait v1.2.1
   Compiling void v1.0.2
   Compiling byteorder v1.5.0
   Compiling embedded-hal v1.0.0
   Compiling critical-section v1.2.0
   Compiling bitfield v0.13.2
   Compiling portable-atomic v1.15.0
   Compiling gcd v2.3.0
   Compiling bitflags v1.3.2
   Compiling embedded-io v0.6.1
   Compiling panic-halt v1.0.0
   Compiling bare-metal v0.2.5
   Compiling cortex-m-rt v0.7.6
error[E0463]: can't find crate for `core`                                                                                
  |
  = note: the `thumbv7m-none-eabi` target may not be installed
  = help: consider downloading the target with `rustup target add thumbv7m-none-eabi`

For more information about this error, try `rustc --explain E0463`.
error: could not compile `nb` (lib) due to 1 previous error                                                              
warning: build failed, waiting for other jobs to finish...
error: could not compile `vcell` (lib) due to 1 previous error
error: could not compile `stable_deref_trait` (lib) due to 1 previous error                                              
error: could not compile `void` (lib) due to 1 previous error                                                            
error: could not compile `byteorder` (lib) due to 1 previous error                                                       
error: could not compile `critical-section` (lib) due to 1 previous error
error: could not compile `embedded-hal` (lib) due to 1 previous error                                                    
error: could not compile `bitfield` (lib) due to 1 previous error                                                        
error: could not compile `gcd` (lib) due to 1 previous error                                                             
error: could not compile `bitflags` (lib) due to 1 previous error                                                        
error: could not compile `embedded-io` (lib) due to 1 previous error                                                     
error: could not compile `panic-halt` (lib) due to 1 previous error
error: could not compile `bare-metal` (lib) due to 1 previous error                                                      
error: could not compile `portable-atomic` (lib) due to 1 previous error                                                 
error: could not compile `cortex-m-rt` (lib) due to 1 previous error   
```

---
这个错误是因为你的 Rust 环境缺少 **`thumbv7m-none-eabi`** 这个目标平台支持。这是嵌入式 ARM Cortex-M3/M4 开发必需的。

#### 1.1.3.2 解决方案

执行以下命令安装对应的目标平台：
`rustup target add thumbv7m-none-eabi`

#### 1.1.3.3 BUG 2
```go
PS G:\Code\Embedded\Stm32\hello-stm32-rust> cargo build                         
   Compiling nb v1.1.0
   Compiling vcell v0.1.3
   Compiling stable_deref_trait v1.2.1
   Compiling byteorder v1.5.0
   Compiling embedded-hal v1.0.0
   Compiling void v1.0.2
   Compiling critical-section v1.2.0
   Compiling bitfield v0.13.2
   Compiling portable-atomic v1.15.0
   Compiling gcd v2.3.0
   Compiling bitflags v1.3.2
   Compiling embedded-io v0.6.1
   Compiling panic-halt v1.0.0
   Compiling bare-metal v0.2.5
   Compiling cortex-m-rt v0.7.6
   Compiling embedded-dma v0.2.0                                                                                         
   Compiling nb v0.1.3                                                                                                   
   Compiling volatile-register v0.2.2                                                                                    
   Compiling hash32 v0.3.1                                                                                               
   Compiling embedded-can v0.4.1                                                                                         
   Compiling fugit v0.3.9                                                                                                
   Compiling embedded-hal-nb v1.0.0
   Compiling embedded-hal v0.2.7                                                                                         
   Compiling heapless v0.8.0                                                                                             
   Compiling bxcan v0.8.0                                                                                                
   Compiling cortex-m v0.7.9                                                                                             
   Compiling fugit-timer v0.1.3                                                                                          
   Compiling stm32f1 v0.16.0                                                                                             
   Compiling usb-device v0.3.2                                                                                           
   Compiling stm32-usbd v0.8.0                                                                                           
   Compiling stm32f1xx-hal v0.11.0                                                                                       
   Compiling hello-stm32-rust v0.1.0 (G:\Code\Embedded\Stm32\hello-stm32-rust)                                           
error: cannot find macro `println` in this scope                                                                         
  --> src\main.rs:12:5
   |
12 |     println!("Hello, world!");
   |     ^^^^^^^

warning: unused import: `hal::prelude::*`                                                                                
 --> src\main.rs:7:5
  |
7 | use hal::prelude::*;
  |     ^^^^^^^^^^^^^^^
  |
  = note: `#[warn(unused_imports)]` (part of `#[warn(unused)]`) on by default

warning: `hello-stm32-rust` (bin "hello-stm32-rust") generated 1 warning                                                 
error: could not compile `hello-stm32-rust` (bin "hello-stm32-rust") due to 1 previous error; 1 warning emitted
```

### 1.1.4 配置成功之后，我们去使用一些简单例程
