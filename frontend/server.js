require('dotenv').config();
const express = require('express');
const { S3 } = require('aws-sdk');
const cors = require('cors');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const app = express();

// Включаем CORS для фронтенда
app.use(cors());

// Раздача статических файлов
app.use(express.static(path.join(__dirname)));

// Парсинг JSON и форм-данных
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3({
	accessKeyId: process.env.ACCESS_KEY_ID,
	secretAccessKey: process.env.SECRET_ACCESS_KEY,
	endpoint: 'https://storage.yandexcloud.net',
	s3ForcePathStyle: true,
	region: 'ru-central1',
});

// Получение presigned URL (оставляем для совместимости)
app.post('/get-upload-url', (req, res) => {
	const { fileName } = req.body;
	const params = {
		Bucket: process.env.BUCKET_NAME,
		Key: fileName,
		Expires: 3600,
	};
	s3.getSignedUrl('putObject', params, (err, url) => {
		if (err) return res.status(500).send(err);
		res.json({ uploadUrl: url });
	});
});

// Новый endpoint для загрузки и уменьшения файла
app.post('/upload', upload.single('file'), async (req, res) => {
	const file = req.file;
	if (!file) return res.status(400).send('Файл не загружен');

	try {
		// Уменьшаем изображение пропорционально до максимума 400x300px с фоном
		const resizedBuffer = await sharp(file.buffer)
			.resize(300, 200, {
				fit: 'inside', // Масштабирование без обрезки
				position: 'center',
				background: { r: 255, g: 255, b: 255, alpha: 1 },
			})
			.toFormat('jpeg') // Преобразуем в JPEG
			.toBuffer();

		const params = {
			Bucket: process.env.BUCKET_NAME,
			Key: file.originalname,
			Body: resizedBuffer,
			ContentType: 'image/jpeg',
		};

		await s3.upload(params).promise();
		res.status(200).send('Файл загружен!');
	} catch (err) {
		console.error('Ошибка обработки или загрузки:', err);
		res.status(500).send('Ошибка загрузки файла');
	}
});

app.listen(3000, () => console.log('Сервер запущен на порту 3000'));
