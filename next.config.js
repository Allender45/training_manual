/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['pg'],
    transpilePackages: ['ckeditor5', '@ckeditor/ckeditor5-react'],
};

module.exports = nextConfig;