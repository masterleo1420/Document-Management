const fs = require('fs');

const removeFile = async (filePath) => {
    
    try {
        if(!filePath) return 
        fs.unlink('./public'+filePath, (err) => {
            if (err) {
                throw err;
            }
        });
        return
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    removeFile
}
