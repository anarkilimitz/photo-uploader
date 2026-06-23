async function uploadFile() {
	const fileInput = document.getElementById('fileInput');
	const file = fileInput.files[0];
	if (!file) return alert('Выберите файл!');

	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch('http://localhost:3000/upload', {
		method: 'POST',
		body: formData,
	});

	if (response.ok) {
		document.querySelector('.modal-container').style.display = 'flex';
		document.querySelector('.file-name').textContent = 'Файл не выбран'; // Сброс после загрузки
		fileInput.value = ''; // сбрасываем выбранный файл
	} else {
		alert('Ошибка загрузки: ' + response.status);
	}
}

document.querySelector('.upload-btn').addEventListener('click', uploadFile);
document.getElementById('fileInput').addEventListener('change', (e) => {
	const fileName = e.target.files[0]
		? e.target.files[0].name
		: 'Файл не выбран';
	document.querySelector('.file-name').textContent = fileName;
});

document.querySelector('.close-button').addEventListener('click', () => {
	document.querySelector('.modal-container').style.display = 'none';
});
