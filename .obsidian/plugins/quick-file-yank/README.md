# Obsidian Sample


## Introduction

This is a sample for Obsidian Plugin development.

This sample, do not need to install node, git, etc., just use the native javascript development can be.


## Tips and tricks

1. Create a new .hotreload empty file in the root directory, and install Hot Reload plugin to auto hotload.

2. Restart obsidian can use location.reload() instead.

3. Open the developer tools

    open the Developer Tools by pressing Ctrl+Shift+I (or Cmd+Option+I on macOS).


4. Switching between mobile and desktop devices

    this.app.emulateMobile(!this.app.isMobile);

5. debugging dynamically generated content can use

    await sleep(5000);debugger;

5. Code hints
You can create a new node_modules/obsidian folder and copy the obsidian.d.ts file to it. For more information, please refer to [obsidian-sample.zip](https://github.com/wish5115/my-softs/releases/download/ObsidianSample/obsidian-sample.zip)


## Official Documentation

English Documentation

https://docs.obsidian.md/Home

中文文档

https://luhaifeng666.github.io/obsidian-plugin-docs-zh/zh2.0/

Other documentation (unofficial)

https://publish.obsidian.md/hub/04+-+Guides%2C+Workflows%2C+%26+Courses/for+Plugin+Developers

https://liamca.in/hello


## Known Issues

But there are drawbacks:

1. does not support typescript, if you want to support the need for IDE plug-ins for conversion

2. Not convenient to import external modules, if you import external modules need to use the full path, and module changes will not be hot loading, each time you modify the module needs to restart obsidian.
However, you can write the module to main.js can be, general small plug-in or learning plug-in development enough.
**Of course, if there are experts have a better way, please advise more! Thank you!**
