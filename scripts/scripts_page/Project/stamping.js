const default_dataStamp = getQueryParams();
const {
    CustomerName,
    ProjectID,
    ProjectPartID,
    Model,
    RefNo,
    ApproveBy,
    ApproveSignTime,
    DocFilePath
} = default_dataStamp;

let imageCounter = 0;
let savedSignatures = [];
let selectedImage = null;

//* Get PDF
async function GetPDFShow() {
    let url = DocFilePath

    const pdfUrl = url
    const pdfjsLib = window['pdfjs-dist/build/pdf'];

    try {
        // ดึงข้อมูล PDF จาก URL
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

        const pdfContainer = document.getElementById('pdf-container');
        pdfContainer.innerHTML = '';

        const imageTabs = document.getElementById('imageTabs');
        imageTabs.innerHTML = '';

        let pagePositions = []; // เก็บตำแหน่ง y ของแต่ละหน้า

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const scale = 3;
            const viewport = page.getViewport({
                scale: scale
            });

            const div = document.createElement('div');
            div.id = `page-${pageNumber}`;
            div.className = 'pdf-page'; // เพิ่มคลาสสำหรับหน้า PDF
            div.style.display = 'block';

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            canvas.style.width = '100%'; // ขยายขนาด canvas ตามคอนเทนเนอร์
            canvas.style.height = 'auto';

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            div.appendChild(canvas);
            document.getElementById('pdf-container').appendChild(div);

            await page.render(renderContext).promise;

            //* Tab 
            const tab = document.createElement('div');
            tab.className = 'image-tab';
            tab.dataset.pageNumber = pageNumber; // เก็บหมายเลขหน้าใน dataset
            tab.style.width = '140px';
            tab.style.height = 'auto';
            tab.style.marginLeft = 'auto';
            tab.style.marginRight = 'auto';
            tab.style.border = '2px solid #d1d1d1';
            tab.style.cursor = 'pointer';
            tab.style.display = 'block';
            tab.addEventListener('click', function () {
                pdfContainer.scrollTop = pagePositions[pageNumber - 1];
                document.querySelectorAll('.image-tab').forEach(tab => tab.classList.remove('selected-tab'));
                this.classList.add('selected-tab');
            });

            const tabImage = document.createElement('img');
            tabImage.src = canvas.toDataURL();
            tabImage.alt = `Page ${pageNumber}`;
            tabImage.style.width = '100%';
            tab.appendChild(tabImage);

            const tabLabel = document.createElement('div');
            tabLabel.textContent = ` ${pageNumber}`;
            tabLabel.style.textAlign = 'center';
            // tabLabel.style.color='#19456B'
            // tabLabel.style.fontWeight="bold"
            tab.appendChild(tabLabel);

            imageTabs.appendChild(tab);

            div.appendChild(canvas);
            pdfContainer.appendChild(div);

            if (pageNumber === 1) {
                tab.classList.add('selected-tab');
            }

            const tabHeight = tab.offsetHeight;
            pagePositions.push(div.offsetTop - tabHeight);
        }

        $("#pdf-container").css({
            "overflow-x": "hidden",
            "width": "100%", // ใช้ขนาดเต็มที่
            "max-width": "100%",
            "height": "auto", // ปรับขนาดตามเนื้อหาด้านใน
        });

        //* Scroll เพื่อให้เลื่อนขึ้นลงตรงกับ Tab
        pdfContainer.addEventListener('scroll', function () {
            for (let i = 0; i < pagePositions.length; i++) {
                let mapScroll = pdfContainer.scrollTop + 50;
                if (mapScroll >= pagePositions[i] && (i === pagePositions.length - 1 || mapScroll < pagePositions[i + 1])) {
                    document.querySelectorAll('.image-tab').forEach(tab => tab.classList.remove('selected-tab'));
                    const selectedTab = document.querySelector(`.image-tab[data-page-number="${i + 1}"]`);
                    if (selectedTab) {
                        selectedTab.classList.add('selected-tab');
                    }
                    break;
                }
            }
        });

    } catch (error) {
        console.error('Error loading PDF:', error);
    }
}

//* รูปภาพเข้า Container
function handleFiles(files, pageNumber) {
    if (files.length > 0) {
        var file = files[0];
        if (file.type.startsWith('image/')) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    // กำหนดตำแหน่งและขนาดของรูปภาพที่ต้องการ
                    img.style.position = 'absolute';
                    img.style.left = '0px'; // ตำแหน่ง x
                    img.style.top = '0px'; // ตำแหน่ง y
                    img.style.width = img.width
                    img.style.height = img.height

                    // กำหนดค่า id เฉพาะให้กับองค์ประกอบ <img>
                    let imageId = `image-${imageCounter}`;
                    img.id = imageId;
                    img.className = 'resize-drag';

                    imageCounter++; // การเพิ่มค่าตัวนับสำหรับรูปภาพถัดไป

                    // การเพิ่ม (append) องค์ประกอบ <img> เข้าไปในคอนเทนเนอร์ที่เก็บแคนวาสของหน้าที่ระบุไว้
                    let container = document.getElementById(`page-${pageNumber}`);
                    container.style.position = 'relative';
                    container.appendChild(img);

                    // เลือก container ที่ต้องการเพิ่มรูปภาพ
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
}

//* กาลากเลื่อนรูป
function dragMoveListener(event) {
    var target = event.target
    // เก็บตำแหน่งที่ลากไว้ในแอตทริบิวต์ data-x และ data-y
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

    // แปลตำแหน่งขององค์ประกอบโดยใช้การแปลง (translate)
    target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

    // อัปเดตแอตทริบิวต์ตำแหน่ง (data-x, data-y)
    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
}

$(document).ready(function () {

    GetPDFShow()
    let imageId = null;

    const {
        PDFDocument
    } = PDFLib

    //*======================================== On Click =======================================|
    //* Add Image
    $(document).on('click', "#addButton", function () {
        // สร้าง canvas ใหม่
        const canvas = document.createElement('canvas');
        canvas.width = 400; // ปรับความกว้างตามต้องการ
        canvas.height = 250; // ปรับความสูงตามต้องการ

        const context = canvas.getContext('2d');

        // กำหนดฟอนต์และสีสำหรับหัวข้อ
        context.font = "bold 80px Arial"; // เปลี่ยนขนาดฟอนต์
        context.fillStyle = "red";

        // คำนวณตำแหน่ง X สำหรับหัวข้อ
        const title = "Approved";
        const titleWidth = context.measureText(title).width;
        const titleX = (canvas.width - titleWidth) / 2; // คำนวณตำแหน่ง X ให้อยู่กลาง
        const titleY = 80 + 10; // เพิ่มระยะห่างด้านบน (margin-top) 10px

        // วาดหัวข้อ
        context.fillText(title, titleX, titleY); // วาดหัวข้ออยู่ที่ตำแหน่ง Y = 40

        // กำหนดฟอนต์และสีสำหรับข้อความอื่น ๆ
        context.font = "30px Arial"; // ขนาดฟอนต์สำหรับข้อความอื่น ๆ
        context.fillText(`Name: ${ApproveBy}`, 20, 150); // วาดชื่อ
        context.fillText(`Date: ${ApproveSignTime}`, 20, 200); // วาดวันที่        
        // คำนวณขนาดกรอบที่ต้องการวาด
        const borderPadding = 5; // ระยะห่างระหว่างข้อความกับกรอบ
        const borderHeight = 220; // ความสูงรวมของกรอบ
        const borderWidth = canvas.width - borderPadding * 2; // ความกว้างของกรอบ

        // วาดกรอบชั้นแรก (กรอบนอก)
        context.strokeStyle = "red"; // สีกรอบนอก
        context.lineWidth = 5; // ความหนาของกรอบนอก
        context.strokeRect(borderPadding, 20, borderWidth, borderHeight); // วาดกรอบนอก

        // วาดกรอบชั้นที่สอง (กรอบใน)
        context.strokeStyle = "red"; // สีกรอบใน
        context.lineWidth = 1; // ความหนาของกรอบใน
        const innerPadding = 1; // ระยะห่างระหว่างกรอบนอกและกรอบใน
        context.strokeRect(borderPadding + innerPadding, 20 + innerPadding, borderWidth - innerPadding * 2, borderHeight - innerPadding * 2); // วาดกรอบใน

        // แปลงข้อความใน canvas ให้เป็น image URL
        const imageUrl = canvas.toDataURL();


        // แปลง image URL เป็น blob แล้วส่งไปยัง handleFiles
        fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
                const file = new File([blob], 'textImage.png', {
                    type: blob.type
                });
                const files = [file];

                // กำหนดตำแหน่งการเพิ่มรูป (หน้าที่กำหนด)
                const pdfData = DocFilePath;
                const pdfjsLib = window['pdfjs-dist/build/pdf'];
                const pdfContainer = document.getElementById('pdf-container');
                const scrollPosition = pdfContainer.scrollTop + pdfContainer.clientHeight / 2;

                pdfjsLib.getDocument(pdfData).promise.then(pdf => {
                    let pageNumber = 1;
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const container = document.getElementById('page-' + pageNum);
                        if (container) {
                            if (scrollPosition >= container.offsetTop && scrollPosition <= container.offsetTop + container.clientHeight) {
                                pageNumber = pageNum;
                                break;
                            }
                        }
                    }

                    // ส่งค่าไปยังฟังก์ชัน handleFiles
                    handleFiles(files, pageNumber);
                });
            });
    });

    //* Delete Image Click Image Delete
    $(document).on('click', "#imageDelete", function () {
        // เก็บ id ของ element ที่ถูกคลิก
        if (imageId) {
            // ลบภาพที่มี id ที่ตรงกับ imageId
            $('#' + imageId).remove();
            // ล้างค่า imageId หลังจากลบ
            imageId = null;
            $("#imageDelete").addClass("d-none");
        }
    });

    //* Delete Image Click Backspace 
    $(document).keydown(function (event) {
        // ตรวจสอบว่าปุ่ม Delete หรือ Backspace ถูกกด
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (imageId) {
                // ลบภาพที่มี id ที่ตรงกับ imageId
                $('#' + imageId).remove();
                // ล้างค่า imageId หลังจากลบ
                imageId = null;
                $("#imageDelete").addClass("d-none");

            }
        }


    });

    //* Click Image
    $(document).on('click', 'canvas', function () {
        $("#imageDelete").addClass("d-none");
        $(".resize-drag").removeClass('selected');
        imageId = null;
    })

    $(document).on('click', "[id^='image-']", function () {
        // เก็บ id ของ element ที่ถูกคลิก
        imageId = $(this).attr('id');

        $(".resize-drag").removeClass("selected");
        $(this).addClass("selected");
        $("#imageDelete").removeClass("d-none");

    });

    //* Download PDF
    $('#downloadPDF').on('click', async function () {
        $(".resize-drag").removeClass("selected");
        const {
            PDFDocument
        } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const divs = document.querySelectorAll('div[id^="page-"]');
        const fileName = sessionStorage.getItem('FileName');
        const canvases = [];

        // แสดง SweetAlert2 เริ่มต้น
        Swal.fire({
            title: "กำลังสร้าง PDF",
            timerProgressBar: true,
            showConfirmButton: false, // ซ่อนปุ่ม OK
            html: "<div>กรุณารอสักครู่...<b>0%</b></div>",
            didOpen: () => {
                // แสดงไอคอนหมุนโหลดทันทีเมื่อเปิด
                Swal.showLoading();

                let progress = 0;
                const timerInterval = setInterval(() => {
                    progress += 10; // เพิ่มค่าโปรเกรส
                    if (progress <= 100) {
                        Swal.update({
                            html: `<div>กรุณารอสักครู่...<b>${progress}%</b></div>`, // อัปเดตเปอร์เซ็นต์
                        });
                        Swal.showLoading();
                    }

                    if (progress === 100) {
                        clearInterval(timerInterval);
                        Swal.update({
                            html: "<div>รอซักครู่...</div>", // เปลี่ยนข้อความเป็น "รอซักครู่..." เมื่อถึง 100%
                        });
                        // ไม่จำเป็นต้องเรียก Swal.showLoading() ที่นี่
                        Swal.showLoading();
                        // ถ้าต้องการให้มีการทำงานต่อหลังจากนี้ สามารถทำได้
                    }
                }, 500); // ปรับความเร็วในการอัปเดตตามต้องการ
            },
        });

        // แปลง <div> เป็นแคนวาส (Canvas) และเก็บไว้ในอาเรย์
        for (let i = 0; i < divs.length; i++) {
            const div = divs[i];
            const canvas = await html2canvas(div, {
                scale: 3,
            });
            canvases.push(canvas);

            // อัปเดตความคืบหน้าหลังจากที่แต่ละแคนวาสถูกประมวลผล
            const progress = Math.round(((i + 1) / divs.length) * 100);
            Swal.getPopup().querySelector('b').textContent = `${progress}%`;
        }

        // เพิ่มแคนวาสลงใน PDF
        for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i];
            const imgDataUrl = canvas.toDataURL('image/png', 1); // คุณภาพสูง
            const pageWidth = canvas.width;
            const pageHeight = canvas.height;
            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            const imgData = await fetch(imgDataUrl).then(res => res.arrayBuffer());
            const img = await pdfDoc.embedPng(imgData);

            // วาดภาพลงในหน้าของ PDF"
            page.drawImage(img, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight,
            });
        }

        // บันทึก PDF ลงใน ArrayBuffer
        const pdfBytes = await pdfDoc.save();

        // สร้างข้อมูลฟอร์มเพื่อส่งไปยังเซิร์ฟเวอร์
        let formData = new FormData();
        formData.append("ProjectPartID", ProjectPartID);
        formData.append("part_doc", new Blob([pdfBytes], {
            type: "application/pdf"
        }), fileName);

        // ส่ง PDF ไปยังเซิร์ฟเวอร์ผ่าน AJAX
        $.ajax({
            type: "PUT",
            url: `/project/part/upload/doc`,
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                Swal.fire({
                    position: 'center',
                    icon: 'success',
                    title: 'บันทึกเรียบร้อย',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    const data = {
                        CustomerName: CustomerName,
                        Model: Model,
                        RefNo: RefNo,
                        ProjectID: ProjectID,
                    };

                    // แปลงข้อมูลเป็น query string
                    const queryString = new URLSearchParams(data).toString();
                    window.location.href = `/projectRevise?${queryString}`;
                });
            },

            error: function (err) {
                console.log(err);
                Swal.fire({
                    position: 'center',
                    icon: 'warning',
                    title: 'Error',
                    text: 'เกิดข้อผิดพลาดในการบันทึก PDF',
                    showConfirmButton: true,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#dc3545'
                });
            }
        });
    });

    //* Cancel
    $(document).on('click', '#btnCalcel', function () {
        const data = {
            CustomerName: CustomerName,
            Model: Model,
            RefNo: RefNo,
            ProjectID: ProjectID,
        };

        // แปลงข้อมูลเป็น query string
        const queryString = new URLSearchParams(data).toString();
        window.location.href = `/projectRevise?${queryString}`;
    })

    //*======================================== Setting Drag Move  =======================================|

    // var dropArea = document.getElementById('pdf-container');

    // ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    //     dropArea.addEventListener(eventName, preventDefaults, false);
    // });

    // // เพิ่มอีเวนต์เพื่อเปลี่ยนรูปแบบเมื่อมีการลากไฟล์เข้ามาในพื้นที่ drop-area
    // ['dragenter', 'dragover'].forEach(eventName => {
    //     dropArea.addEventListener(eventName, () => {
    //         dropArea.style.backgroundColor = '#f0f0f0';
    //     }, false);
    // });

    // ['dragleave', 'drop'].forEach(eventName => {
    //     dropArea.addEventListener(eventName, () => {
    //         dropArea.style.backgroundColor = '';
    //     }, false);
    // });

    // // อีเวนต์สำหรับการปล่อยไฟล์ลงใน drop-area
    // dropArea.addEventListener('drop', handleDrop, false);
    window.dragMoveListener = dragMoveListener

    interact('.resize-drag')
        .draggable({
            // เปิดใช้งาน
            inertia: true,
            // ให้รักษาองค์ประกอบให้อยู่ภายในพื้นที่ของพาเรนต์
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ],
            // เปิดใช้งานการเลื่อนอัตโนมัติ
            autoScroll: true,

            listeners: {
                // เรียกใช้ฟังก์ชันนี้ในทุกเหตุการณ์ที่มีการลากและเคลื่อนที่
                move: dragMoveListener,

                // เรียกใช้ฟังก์ชันนี้ในทุกเหตุการณ์ที่ลากเสร็จสิ้น
                end(event) {
                    var textEl = event.target.querySelector('p')
                    //             event.target.classList.remove('dragging')

                    textEl && (textEl.textContent =
                        'moved a distance of ' +
                        (Math.sqrt(Math.pow(event.pageX - event.x0, 2) +
                            Math.pow(event.pageY - event.y0, 2) | 0))
                        .toFixed(2) + 'px')
                }
            }
        })
    // interact('.resize-drag')
    //     .draggable({
    //         inertia: true,
    //         modifiers: [
    //             interact.modifiers.restrictRect({
    //                 restriction: 'parent',
    //                 endOnly: true
    //             })
    //         ],
    //         listeners: {
    //             move: dragMoveListener,
    //             // call this function on every dragend event
    //             end(event) {
    //             // Hide border when dragging ends
    //             event.target.classList.remove('dragging')
    //             // console.log("HelloWorldddd")
    //         },
    //         start(event) {
    //             // Show border when dragging starts
    //             event.target.classList.add('dragging')
    //         }
    //         },

    //     })
})