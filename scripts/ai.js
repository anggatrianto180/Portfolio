// AI & file handling logic
document.addEventListener('DOMContentLoaded', function () {
    const generateBtn = document.getElementById('generate-btn');
    const featureInput = document.getElementById('feature-input');
    const resultContainer = document.getElementById('result-container');
    const fileInput = document.getElementById('file-input');
    const fileDropZone = document.getElementById('file-drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');
    let uploadedFile = null;

    // Basic sanity checks to make debugging easier
    if (!resultContainer) {
        console.error('result-container element not found. AI generator cannot show results.');
    }
    if (!generateBtn) {
        if (resultContainer) resultContainer.innerHTML = '<p class="text-red-500">Error: tombol generate tidak ditemukan di halaman.</p>';
        console.error('generate-btn not found');
        return;
    }

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        if (fileDropZone) fileDropZone.addEventListener(eventName, preventDefaults, false);
    });
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    ['dragenter', 'dragover'].forEach(eventName => { if (fileDropZone) fileDropZone.addEventListener(eventName, () => fileDropZone.classList.add('dragover'), false); });
    ['dragleave', 'drop'].forEach(eventName => { if (fileDropZone) fileDropZone.addEventListener(eventName, () => fileDropZone.classList.remove('dragover'), false); });
    if (fileDropZone) fileDropZone.addEventListener('drop', handleDrop, false);
    if (fileInput) fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleDrop(e) { let dt = e.dataTransfer; let files = dt.files; handleFiles(files); }
    function handleFiles(files) { if (files.length > 0) { uploadedFile = files[0]; if (fileNameDisplay) fileNameDisplay.textContent = uploadedFile.name; if (featureInput) featureInput.value = ''; } }

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            let content = '';
            const featureDescription = featureInput ? featureInput.value.trim() : '';

            if (uploadedFile) {
                if (resultContainer) resultContainer.innerHTML = '<div class="loader"></div><p class="text-center text-slate-500">Membaca file...</p>';
                try { content = await extractTextFromFile(uploadedFile); } catch (error) { if (resultContainer) resultContainer.innerHTML = `<p class="text-red-500">Gagal membaca file: ${error.message}</p>`; return; }
            } else if (featureDescription) { content = featureDescription; }
            else { if (resultContainer) resultContainer.innerHTML = '<p class="text-red-500">Silakan unggah file atau masukkan deskripsi fitur.</p>'; return; }

            if (!content) { if (resultContainer) resultContainer.innerHTML = '<p class="text-red-500">Tidak ada konten yang bisa diproses dari file.</p>'; return; }

            const MAX_CHARS = 25000;
            if (content.length > MAX_CHARS) { console.warn(`Content truncated from ${content.length} to ${MAX_CHARS} characters.`); content = content.substring(0, MAX_CHARS); }

            if (resultContainer) resultContainer.innerHTML = '<div class="loader"></div><p class="text-center text-slate-500">AI sedang membuat test case...</p>';
            generateBtn.disabled = true;
            generateBtn.classList.add('opacity-50', 'cursor-not-allowed');

            try {
                const text = await callGemini(content);
                const jsonData = JSON.parse(text);
                const tableHtml = renderTables(jsonData);
                if (resultContainer) resultContainer.innerHTML = tableHtml;
            } catch (error) {
                console.error('Error processing request:', error);
                if (resultContainer) resultContainer.innerHTML = '<p class="text-red-500">Maaf, terjadi kesalahan saat memproses data. Respon dari AI mungkin tidak valid.</p>';
            } finally {
                generateBtn.disabled = false;
                generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                uploadedFile = null;
                if (fileNameDisplay) fileNameDisplay.textContent = '';
                if (fileInput) fileInput.value = '';
            }
        });
    }

    async function extractTextFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    if (file.type === "application/pdf") {
                        const pdf = await pdfjsLib.getDocument({ data: event.target.result }).promise;
                        let text = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            text += content.items.map(item => item.str).join(' ');
                        }
                        resolve(text);
                    } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                        const result = await mammoth.extractRawText({ arrayBuffer: event.target.result });
                        resolve(result.value);
                    } else {
                        reject(new Error("Format file tidak didukung."));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = error => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    async function callGemini(promptText, retries = 3, delay = 1000) {
        const prompt = `You are a Senior QA Engineer. Your task is to generate a comprehensive set of test cases based on a given feature description.
                Structure your response as a single JSON object.
                The object must have three keys: "positive", "negative", and "edgeCase".
                Each key must contain an array of test case objects.
                Each test case object must have three string properties: "no" (a unique ID like 'TC-POS-01'), "title", and "description".
                Respond ONLY with the raw JSON object, without any markdown formatting or extra text.

                Feature Description: "${promptText}"`;

        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        
        const schema = {
            type: "OBJECT",
            properties: {
                "positive": {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "no": { type: "STRING" },
                            "title": { type: "STRING" },
                            "description": { type: "STRING" },
                        },
                        required: ["no", "title", "description"]
                    }
                },
                "negative": {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "no": { type: "STRING" },
                            "title": { type: "STRING" },
                            "description": { type: "STRING" },
                        },
                        required: ["no", "title", "description"]
                    }
                },
                "edgeCase": {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "no": { type: "STRING" },
                            "title": { type: "STRING" },
                            "description": { type: "STRING" },
                        },
                        required: ["no", "title", "description"]
                    }
                },
            },
            required: ["positive", "negative", "edgeCase"]
        };

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        };
        

    const apiKey = "AIzaSyA8Zf3OVkG6jpc8TFeNQMGKV8s1-VBx1wQ";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid response structure from API');
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`, error);
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, delay));
            delay *= 2;
        }
    }
    }
    
    function renderTables(data) {
        const categoryTitles = {
            positive: "Skenario Positif",
            negative: "Skenario Negatif",
            edgeCase: "Skenario Edge Case"
        };

        let html = '';

        for (const category in data) {
            if (data[category].length > 0) {
                html += `<h3 class="text-xl font-bold text-slate-800 mt-6 mb-4">${categoryTitles[category]}</h3>`;
                html += `
                    <div class="overflow-x-auto rounded-lg border border-slate-200">
                        <table class="min-w-full divide-y-2 divide-slate-200 bg-white text-sm">
                            <thead class="bg-slate-50">
                                <tr>
                                    <th class="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-900">No</th>
                                    <th class="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-900">Title</th>
                                    <th class="whitespace-nowrap px-4 py-2 text-left font-semibold text-slate-900">Description</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-200">
                `;
                        
                data[category].forEach(item => {
                    html += `
                        <tr>
                            <td class="whitespace-nowrap px-4 py-2 font-medium text-slate-900">${item.no}</td>
                            <td class="whitespace-nowrap px-4 py-2 text-slate-700">${item.title}</td>
                            <td class="px-4 py-2 text-slate-700">${item.description}</td>
                        </tr>
                    `;
                });

                html += `</tbody></table></div>`;
            }
        }
        return html;
    }
});
