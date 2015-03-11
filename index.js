// dependencies
var AWS = require('aws-sdk');
var gm = require('gm')
            .subClass({ imageMagick: true }); // Enable ImageMagick integration.
var ffmpeg = require('fluent-ffmpeg');
var q = require('q');

process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']

var s3 = new AWS.S3();

exports.moveAndChmodFfmpegBinary = function() {
  var def = q.defer()

  require('child_process').exec(
    'cp /var/task/ffmpeg /tmp/.; chmod 755 /tmp/ffmpeg',
    function (error, stdout, stderr) {
      if (error) {
        def.reject(error)
      } else {
        def.resolve()
      }
    }
  )

  return def.promise;
}

exports.printFormats = function() {
    var def = q.defer()

    ffmpeg.getAvailableFormats(function(err, formats) {
      if (err) {
        def.reject(err);
      } else {
        console.log('Available formats:');
        console.dir(formats.wtv);
        def.resolve()
      }
    });

    return def.promise;
}

exports.handler = function(event, context) {
  //assign these for prod – if ffmpeg-fluent doesn't find them,
  //it falls back to the machine's local `ffmpeg`
  process.env['FFMPEG_PATH'] = '/tmp/ffmpeg';
  process.env['FFPROBE_PATH'] = '/tmp/ffprobe';

  var promises = [];

  if (!process.env.NODE_ENV || process.env.NODE_ENV != 'testing') {
    promises.push(this.moveAndChmodFfmpegBinary);
  }

  promises.push(this.printFormats);

  promises.reduce(q.when, q()).fail(function(err){
    console.log('rejected err');
    console.log(err);
  });

};
