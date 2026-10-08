Cipher Studio modular edition

Upload the ENTIRE folder to your hosting provider, preserving file paths. Open index.html to run locally.

To add a cipher, create ciphers/newcipher.js assigning window.CIPHER_DEFINITIONS.newcipher = {name: "Name", glyphs: [{label:"glyph ID",value:"A",count:1,img:"data:image/png;base64,..."}]}; then include a script tag for it before cipher-engine.js in index.html.

Crisp threshold: grayscale <= 190 black, >190 white. Original source images untouched.
