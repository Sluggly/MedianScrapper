Median XL Scrapper - made by Sluggly#6583

How to use:
You need to have node.js installed to run the bot.
https://nodejs.org/en/ download here, any version listed on the frontpage should work.

When installed, open a command prompt and go to the folder where the medianXL.js file is located.
To do so, write in the command prompt: cd C:\Users\~\Desktop\Diablo II Scrapper
Replace the path with your own path, don't just copy what is above, this is just an example.

After that, type in the command prompt: node medianXL.js
The server should now launch, if you see no error message in the command prompt it is fine and running.
Now you can let that run in background and open a web page using any of your favorite web browser,
and type in the url: localhost:8000
Also the server runs locally, so if you have two computers on the same local network, you can open the browser
on the computer not hosting the bot and type that computer IPv4 with port 8000. Example: 192.168.1.1:8000
To see a computers IPv4 open a command prompt and type ipconfig, it should most of the time start by 192.168...
Beware if you have a setup like this, the config file uses the server file only, also there might be some errors
in loading images when showing a lot of items.

If everything worked correctly you should be greeted by a login page where you have to log in using your
Diablo II Median XL username and password or use offline mode if you prefer.
This is not a scam, no data are being collected, these info are needed to be able to log in to the Not Armory
website which is the only place where data about characters can be collected, if you don't trust me just use offline mode.

After logging in, you should see a list of your characters, grayed out characters will not be checked, toggle
them by clicking characters you want to check or not. Same applys for filters when looking for stuff,
grayed out filters will not show items associated to it.

Try to only have a single web page open at once, multiples pages could cause some crashes most of them are being worked on.

This is an early version so if you see any bugs or if you have any ideas contact me via Discord.

Offline mode: To use it you need to go to the configuration page or to edit the config.ini file located in the folder.
When using offline mode, the characters inventory must be public.
Do not edit the config.ini file manually, use the configuration page for it. Only manually edit it if you know what
you are doing or most likely the scripts won't work as intended. If you still did you can always redownload the files.