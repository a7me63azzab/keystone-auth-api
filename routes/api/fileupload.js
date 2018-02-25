var async = require('async'),
keystone = require('keystone');
var exec = require('child_process').exec;
let randomstring = require('randomstring');
let crypto = require('crypto-js');
let fs = require('fs');
var FileData = keystone.list('FileUpload');


let _generateUniqueFileName = () => crypto.SHA256(randomstring.generate() + new Date().getTime() + 'hasve').toString();
/**
 * List Files
 */
exports.list = function(req, res) {
  FileData.model.find(function(err, items) {

    if (err) return res.apiError('database error', err);

    res.apiResponse({
      collections: items
    });

  });
}

/**
 * Get File by ID
 */
exports.get = function(req, res) {

  FileData.model.findById(req.params.id).exec(function(err, item) {

    if (err) return res.apiError('database error', err);
    if (!item) return res.apiError('not found');

    res.apiResponse({
      collection: item
    });

  });
}


/**
 * Update File by ID
 */
exports.update = function(req, res) {
  FileData.model.findById(req.params.id).exec(function(err, item) {
    if (err) return res.apiError('database error', err);
    if (!item) return res.apiError('not found');

    var data = (req.method == 'POST') ? req.body : req.query;

    item.getUpdateHandler(req).process(data, function(err) {

      if (err) return res.apiError('create error', err);

      res.apiResponse({
        collection: item
      });

    });
  });
}

/**
 * Upload a New File
 */
exports.create = function(req, res) {

	let item = new FileData.model(),
	data = (req.method === 'POST') ? req.body : req.query;
	console.log('data-----------------',data);
	console.log(data.op && data.imgData && data.op === 'base64');
	console.log(_generateUniqueFileName());
	if (data.op && data.imgData && data.op === 'base64') {

		let imgRawData = data.imgData.replace(/^data:image\/\w+;base64,/, ""); //[?]

		let buf = new Buffer(imgRawData, 'base64'); //[?]
		let fileName = _generateUniqueFileName() + '.png';
		let filePath = 'public/uploads/files/';
		console.log('buf',buf);
		// console.log(fileName);
		fs.writeFile(filePath + fileName, buf, (err) => {
			if (err) {
				return res.apiError(err);
			}
			item.getUpdateHandler(req).process({
					file: {
						filename: fileName,
						size: buf.toString().length,
						//mimetype: 'image/jpeg',
						path: filePath,
						//originalname: 'photo.jpg',
						url: '/uploads/' + fileName,
					}
				}
				, function (err) {
					if (err) return res.apiError('error', err);
					return res.apiResponse({
						file_upload: item
					});

				});


		});

	} else {

		if (!req.files || Object.keys(req.files).length === 0) {
			return res.apiError('no files to be uploaded.');
		}
		item.getUpdateHandler(req).process(req.files, function(err) {

			if (err) return res.apiError('error', err);

			res.apiResponse({
				file_upload: item
			});

		});

	}
  

}

/**
 * Delete File by ID
 */
exports.remove = function(req, res) {
  var fileId = req.params.id;
  FileData.model.findById(req.params.id).exec(function (err, item) {

    if (err) return res.apiError('database error', err);

    if (!item) return res.apiError('not found');

      item.remove(function (err) {

        if (err) return res.apiError('database error', err);

        //Delete the file
        exec('rm public/uploads/files/'+fileId+'.*', function(err, stdout, stderr) {
          if (err) {
			  // console.log('child process exited with error code ' + err.code);
              return;
          }
			// console.log(stdout);
        });

        return res.apiResponse({
          success: true
        });
    });

  });
}
