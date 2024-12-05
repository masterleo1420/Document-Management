function printPageArea(areaID, modalID) {
  let opt = {
    margin: 10,
    filename: "generated-pdf.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },

    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      orientation: "landscape",
    },
  };
  let element = document.getElementById(modalID);
  // html2pdf().set(opt).from(element).save();
  html2pdf()
    // .set(opt)
    .from(element)
    .toPdf()
    .get("pdf")
    .then(function (pdfObj) {
      console.log(pdfObj);
      pdfObj.autoPrint();
      window.open(pdfObj.output("bloburl"), "_blank");
    });
}

const { degrees, PDFDocument, rgb, StandardFonts } = PDFLib;

async function modifyPdf() {
  // Fetch an existing PDF document
  //const url = 'https://pdf-lib.js.org/with_update_sections.pdf'
  // const url = './demoPdfMulti.pdf' //Pdf File
  // const url = "/pdf/demoPdfMulti.pdf";
  const url = "/pdf/Test PDF Veiw.pdf"; 
  const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());

  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Embed the Helvetica font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Get the first page of the document
  const pages = pdfDoc.getPages();

  //Loop multi Page
  for (let i = 0; i < pages.length; i++) {
    let page = pages[i];

    // Get the width and height of the first page
    const { width, height } = page.getSize();

    //Frame SVG
    const svgPath = "M 0,0 L 120,0 L 120,60 L 0,60 L 0,0";

    //Parameter Position
    let init_X = 60;
    // let init_Y = height - 530;
    let init_Y = height - 10;

    let Title1 = "Print Document";
    let Name1 = "Official Drawing";
    let Date1 = "29 May 2004";
    let xBox1 = init_X; //30
    let yBox1 = init_Y;

    // let Title2 = "Document Issue";
    // let Name2 = "SomeName1 BoonSom";
    // let Date2 = "22 May 2004";
    // let xBox2 = xBox1 + 130;
    // let yBox2 = init_Y;

    // let Title3 = "Document Verify";
    // let Name3 = "SomeName2 DeeMark";
    // let Date3 = "25 May 2004";
    // let xBox3 = xBox2 + 130;
    // let yBox3 = init_Y;

    // let Title4 = "Document Approve"
    // let Name4 = "SomeName3 BoNard"
    // let Date4 = "28 May 2004"
    // let xBox4 = xBox3 + 130;
    // let yBox4 = init_Y;
    xBox1 = Math.round(xBox1);
    yBox1 = Math.round(yBox1);
    let posX = new Array(xBox1);
    let posY = new Array(yBox1);
    let title = new Array(Title1);
    let name = new Array(Name1);
    let date = new Array(Date1);

    let stamp_num = name.length;
    if (stamp_num <= 1) {
      page.moveTo(xBox1, yBox1);
      page.drawSvgPath(svgPath, {
        borderColor: rgb(1, 0, 0),
        borderWidth: 1,
      });
      // Text Title
      page.drawText(Title1, {
        x: xBox1 + 10,
        y: yBox1 - 15,
        size: 10,
        font: helveticaFont,
        color: rgb(0.95, 0.1, 0.1),
        //rotate: degrees(-45),
      });
      // Text Name
      page.drawText(Name1, {
        x: xBox1 + 10,
        y: yBox1 - 35,
        size: 10,
        font: helveticaFont,
        color: rgb(0.95, 0.1, 0.1),
        //rotate: degrees(-45),
      });
      // Text Date
      page.drawText(Date1, {
        x: xBox1 + 10,
        y: yBox1 - 55,
        size: 10,
        font: helveticaFont,
        color: rgb(0.95, 0.1, 0.1),
        //rotate: degrees(-45),
      });
    } else {
      for (let i = 0; i < stamp_num; i++) {
        //Draw Box Fram
        page.moveTo(posX[i], posY[i]);
        page.drawSvgPath(svgPath, {
          borderColor: rgb(1, 0, 0),
          borderWidth: 1,
        });
        // Text Title
        page.drawText(title[i], {
          x: posX[i] + 10,
          y: posY[i] - 15,
          size: 10,
          font: helveticaFont,
          color: rgb(0.95, 0.1, 0.1),
          //rotate: degrees(-45),
        });
        // Text Name
        page.drawText(name[i], {
          x: posX[i] + 10,
          y: posY[i] - 35,
          size: 10,
          font: helveticaFont,
          color: rgb(0.95, 0.1, 0.1),
          //rotate: degrees(-45),
        });
        // Text Date
        page.drawText(date[i], {
          x: posX[i] + 10,
          y: posY[i] - 55,
          size: 10,
          font: helveticaFont,
          color: rgb(0.95, 0.1, 0.1),
          //rotate: degrees(-45),
        });
      }
    }
    // Loop Multi Mark
  }

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();
  // Trigger the browser to download the PDF document
  download(pdfBytes, "priva_Stamp2.pdf", "application/pdf");
  // window.open("priva_Stamp2.pdf", "_blank");
}
