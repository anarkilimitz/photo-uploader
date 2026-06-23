const sharp = require('sharp');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
	region: 'ru-central1',
	endpoint: 'https://storage.yandexcloud.net',
	accessKeyId: process.env.ACCESS_KEY_ID,
	secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

exports.handler = async (event) => {
	const bucket = event.Records[0].s3.bucket.name;
	const key = decodeURIComponent(
		event.Records[0].s3.object.key.replace(/\+/g, ' ')
	);

	if (!key.endsWith('.jpg') && !key.endsWith('.png')) {
		console.log('Не изображение:', key);
		return;
	}

	try {
		const { Body: image } = await s3
			.getObject({ Bucket: bucket, Key: key })
			.promise();
		const resized = await sharp(image)
			.resize(300, 200, {
				fit: 'inside',
				position: 'center',
				background: { r: 255, g: 255, b: 255, alpha: 1 },
			})
			.toFormat('jpeg') // Преобразуем в JPEG
			.toBuffer();

		const previewKey = key.replace(/\.(jpg|png)$/, '_preview.$1'); // Поддержка .jpg и .png
		await s3
			.putObject({
				Bucket: bucket,
				Key: previewKey,
				Body: resized,
				ContentType: 'image/jpeg',
			})
			.promise();

		console.log(`Обработано: ${key} -> ${previewKey}`);
	} catch (error) {
		console.error('Ошибка обработки:', error);
		throw error;
	}
};
