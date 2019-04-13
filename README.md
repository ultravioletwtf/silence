# silence
This was used on GLSEN's Day of Silence to operate silence@violet.wtf (Now 
Retired). This code was made in a night and was not intended to look pretty or work fast.

## Modifications from the original folder
* Modified config values to example values
* Removed references to a never-implemented feature
* Cleared `mails.json`
* Removed unused packages
* Removed private copyright notice
* Changed all references to personal email addresses to examples
* Changed all references of `silence@violet.wtf` to `config.imap.user`
* Removed debug `console.log` instances
* Added `.gitignore`
* Added `license.md`
* Modified references to noreply email addresses to `config.imap.user`
* Modified `processMail()` to support any array length
* Added `README.md` (obviously)

## Installation
```
git clone https://github.com/ultravioletwtf/silence
cd silence
npm i
node src
```

## Please do not use this code to reprsent me or my talent.
This was a piece of software to serve one function for one night, made in one night. I don't use it actively, and use more modern solutions usually. This is part of my [pledge to release all retired personal projects](https://violet.wtf/letters/1).