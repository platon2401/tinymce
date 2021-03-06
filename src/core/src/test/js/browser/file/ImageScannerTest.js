asynctest(
  'browser.tinymce.core.file.ImageScannerTest',
  [
    'ephox.mcagar.api.LegacyUnit',
    'ephox.agar.api.Pipeline',
    'tinymce.core.file.ImageScanner',
    'tinymce.core.file.UploadStatus',
    'tinymce.core.file.BlobCache',
    'tinymce.core.file.Conversions',
    'tinymce.core.Env',
    'global!URL',
    'tinymce.core.test.ViewBlock'
  ],
  function (LegacyUnit, Pipeline, ImageScanner, UploadStatus, BlobCache, Conversions, Env, URL, ViewBlock) {
    var success = arguments[arguments.length - 2];
    var failure = arguments[arguments.length - 1];
    var suite = LegacyUnit.createSuite();
    var viewBlock = new ViewBlock();

    if (!Env.fileApi) {
      return;
    }

    var base64Src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAAAAACH5BAAAAAAALAAAAAABAAEAAAICTAEAOw==';
    var blobUriSrc;

    Conversions.uriToBlob(base64Src).then(function (blob) {
      blobUriSrc = URL.createObjectURL(blob);
    });

    suite.asyncTest("findAll", function (_, done) {
      var imageScanner = new ImageScanner(new UploadStatus(), new BlobCache());

      viewBlock.update(
        '<img src="' + base64Src + '">' +
        '<img src="' + blobUriSrc + '">' +
        '<img src="' + Env.transparentSrc + '">' +
        '<img src="' + base64Src + '" data-mce-bogus="1">' +
        '<img src="' + base64Src + '" data-mce-placeholder="1">'
      );

      imageScanner.findAll(viewBlock.get()).then(function (result) {
        done();
        var blobInfo = result[0].blobInfo;
        LegacyUnit.equal(result.length, 2);
        LegacyUnit.equal('data:image/gif;base64,' + blobInfo.base64(), base64Src);
        LegacyUnit.strictEqual(result[0].image, viewBlock.get().firstChild);
      });
    });

    suite.asyncTest("findAll (filtered)", function (_, done) {
      var imageScanner = new ImageScanner(new UploadStatus(), new BlobCache());

      var predicate = function (img) {
        return !img.hasAttribute('data-skip');
      };

      viewBlock.update(
        '<img src="' + base64Src + '">' +
        '<img src="' + base64Src + '" data-skip="1">'
      );

      imageScanner.findAll(viewBlock.get(), predicate).then(function (result) {
        done();
        LegacyUnit.equal(result.length, 1);
        LegacyUnit.equal('data:image/gif;base64,' + result[0].blobInfo.base64(), base64Src);
        LegacyUnit.strictEqual(result[0].image, viewBlock.get().firstChild);
      });
    });

    Conversions.uriToBlob(base64Src).then(function (blob) {
      blobUriSrc = URL.createObjectURL(blob);

      viewBlock.attach();
      Pipeline.async({}, suite.toSteps({}), function () {
        viewBlock.detach();
        success();
      }, failure);
    });
  }
);