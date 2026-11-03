const uploads = [];
const deletions = [];

const fileUploaderPath = require.resolve("../src/utils/fileUploader");
require.cache[fileUploaderPath] = {
  id: fileUploaderPath,
  filename: fileUploaderPath,
  loaded: true,
  exports: {
    uploadFileToCloudinary: async (file) => {
      uploads.push(file?.name || null);
      return {
        secure_url: `https://res.cloudinary.com/demo/image/authenticated/v1/data/upload_${uploads.length}.png`,
        public_id: `data/upload_${uploads.length}`,
        resource_type: "image",
      };
    },
    deleteResourceFromCloudinary: async (publicIdOrUrl) => {
      deletions.push(publicIdOrUrl);
    },
  },
};

require("cloudinary").v2.config({ cloud_name: "test", api_key: "key", api_secret: "secret" });

module.exports = { uploads, deletions };
