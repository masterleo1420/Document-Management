const default_data = getQueryParams();
const {
  CustomerName,
  Model,
  RefNo,
  PartName,
  PartCode,
  ProjectPartID
} = default_data;
$("#inputCustomer").val(CustomerName);
$("#inputModel").val(Model);
$("#inputRefCode").val(RefNo);
$("#inputPartname").val(PartName);
$("#inputPartcode").val(PartCode);

//* Table Revise History
function tbProjectReviseHistory() {
  tbHisRevise = $("#tableHisRevise").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    // ordering: false,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "40vh",
    ajax: {
      url: "/project/part/revise/history",
      method: "post",
      data: {
        ProjectPartID: ProjectPartID
      },
      dataSrc: "",
    },
    columns: [

      {
        data: "ReviseNo",
      },
      {
        data: "PartCode",
      },
      {
        data: "PartName",
      },
      {
        data: "DrawingRev",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "ReviseDate",
        render: function (data, type, row) {
          let ReviseDate = (row.ReviseDate) ? formatDateName(data) : ''
          return ReviseDate
        },
      },
      {
        data: "DocName",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "DocFilePath",
        render: function (data, type, row) {
          let fileName = data.split('/').pop();
          return fileName || "-";
        },
      },
      {
        data: "IssueSignTime",

        render: function (data, type, row) {
          let IssueSignTime = (row.IssueSignTime) ?
            `<div>${row?.IssueBy}</div><div>${formatDateName(data)}</div>` :
            '';
          return IssueSignTime;
        },
      },
      {
        data: "CheckSignTime",
        render: function (data, type, row) {
          let CheckSignTime = (row.CheckSignTime) ?
            `<div>${row?.CheckBy}</div><div>${formatDateName(data)}</div>` :
            ''
          return CheckSignTime
        },
      },
      {
        data: "ApproveSignTime",

        render: function (data, type, row) {
          let ApproveSignTime = (row.ApproveSignTime) ?
            `<div>${row?.ApproveBy}</div><div>${formatDateName(data)}</div>` :
            ''
          return ApproveSignTime
        },
      },
    ],
    layout: {
      topStart: {
        // buttons: ["copy", "csv", "excel", "pdf", "print"],
        buttons: [{
          extend: "csvHtml5",
          text: "Export CSV",
          className: "btn dark", // Add custom class here
        }, ],
      },
    },
  });
}

//* Table History
function tbViewHistory(ProjectPartID) {
  tbViewHisRevise = $("#tableHisPrint").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    scrollCollapse: true,

    ajax: {
      url: "/project/part/doc/view/history",
      method: "post",
      data: {
        ProjectPartID: ProjectPartID
      },
      dataSrc: "",
    },
    columns: [{
        data: "RowNo",
      },
      {
        data: "ViewBy",
      },
      {
        data: "ViewDate",
        render: function (data, type, row) {
          let ViewDate = (row.ViewDate) ? formatDateName(data) : ''
          return ViewDate
        },
      },
      {
        data: "DepartmentName",
        render: function (data, type, row) {
          return data || "-";
        },
      }
    ],
    layout: {
      topStart: {
        buttons: [{
          extend: "csvHtml5",
          text: "Export CSV",
          className: "btn dark", // Add custom class here
        }, ],
      },
    },
  });
}

//* View DOC
function viewPDF(url) {
  if (url) {
    Swal.fire({
      html: `
                <div class="d-flex align-items-center justify-content-end mr-4">
        <button type="button" class="btn btn-fw dark info" id="btnPJReviseHisPrint">
                            <i class="fa fa-print"></i><span class="hidden-xs-down ml-2">Print</span>
                          </button>
                          </div>
        <div id="pdfContainer" style="height: 95%; overflow: hidden; padding-top: 25px;">
                  <object id="pdfViewer" data="${url}#toolbar=0" type="application/pdf" style="width: 100%; height: 100vh;"></object>
               </div>`,
      width: "70%", // ขยายให้เต็มหน้าจอมากขึ้น
      heightAuto: false,
      showCloseButton: true,
      showConfirmButton: false,
      padding: "10px",
      didOpen: () => {
        //* Popup
        const container = document.querySelector(".swal2-popup");
        if (container) {
          container.style.maxHeight = "100vh"; // แสดงเต็มความสูง
          container.style.height = "100vh";
        }

        //* Container
        const pdfContainer = document.getElementById("pdfContainer");
        if (pdfContainer) {
          pdfContainer.style.height = "100vh"; // ขยาย container ให้เต็มหน้า
        }

        //* Close Button
        const closeButton = document.querySelector(".swal2-close");
        if (closeButton) {
          closeButton.style.border = "none";
          closeButton.style.backgroundColor = "transparent";
          closeButton.style.boxShadow = "none";
        }
      },
    });
  } else {
    Swal.fire({
      position: 'center',
      icon: 'warning',
      title: 'ไม่มีไฟล์ Document',
      showConfirmButton: true,
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545'
    });
  }

  //* Check User สิทธิในการ Print
  let item = tbHisRevise.row(".selected").data(); // ดึงข้อมูลของแถวที่ถูกเลือก\
  let DepartmentID = getCookie("DepartmentID"); // NotificationPPC()

  if (DepartmentID == 3 || DepartmentID == 19) {
    if (item?.PartStatus == 4) {
      $("#btnPJReviseHisPrint").removeClass("d-none");
    } else {
      $("#btnPJReviseHisPrint").addClass("d-none");
    }
  } else {
    $("#btnPJReviseHisPrint").addClass("d-none");
  }
}

$(document).ready(function () {
  tbProjectReviseHistory()

  //*======================================== On Click  =======================================|
  //* Select Table
  $("#tableHisRevise tbody").on("click", "tr", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnHisReviseDoc,#btnHisPrint").addClass("d-none");
      $("#modalPrintHistory").modal("hide");
    } else {
      $("#tableHisRevise tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnHisReviseDoc,#btnHisPrint").removeClass("d-none");
      $("#modalPrintHistory").modal("hide");
    }
    let item = tbHisRevise.row('.selected').data();

    if (item) {
      if (item.ProjectPartID) {
        tbViewHistory(item.ProjectPartID)
        if (item.DocFilePath) {
          $("#btnHisReviseDoc").prop("disabled", false);
        } else {
          $("#btnHisReviseDoc").prop("disabled", true);
        }
      }
    }



  });

  //* รับไฟล์ PDF มาเปิด
  $(document).on("click", "#btnHisReviseDoc", function () {
    let item = tbHisRevise.row('.selected').data();
    viewPDF(item.DocFilePath)

  });

  //* Print
  $(document).on("click", "#btnPJReviseHisPrint", function () {
    let item = tbHisRevise.row(".selected").data(); // ดึงข้อมูลของแถวที่ถูกเลือก
    let urlDocFile = item?.DocFilePath; // ดึงค่า DocFilePath จากข้อมูลที่ถูกเลือก
    let ProjectPartID = item?.ProjectPartID

    //* View History
    if (item) {
      $.ajax({
        type: "PUT",
        url: "/project/part/doc/view",
        data: JSON.stringify({
          ProjectPartID
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
          tbViewHistory(ProjectPartID)

        },
        error: function (error) {
          console.log(error)
          errorText = error.responseJSON.message;
          Swal.fire({
            position: 'center',
            icon: 'warning',
            title: 'Warning',
            text: errorText,
            showConfirmButton: true,
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545'
          });
        }
      })
    }
    if (urlDocFile) {
      // เปิดไฟล์ PDF ในหน้าต่างใหม่
      const printWindow = window.open(urlDocFile);
      printWindow.onload = function () {
        printWindow.focus();
        printWindow.print(); // สั่งพิมพ์ไฟล์เมื่อโหลดเสร็จ
      };
    } else {
      Swal.fire({
        title: "Error",
        text: "No document file path found for the selected row.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  });

  $("#btnPrintDoc").unbind();
  $("#btnPrintDoc").on("click", function () {
    printPageArea("", "pdfViewer");
  })

  //* History Print
  $("#btnHisPrint").unbind();
  $("#btnHisPrint").on("click", function () {
    $("#modalPrintHistory").modal("show");
  });

});