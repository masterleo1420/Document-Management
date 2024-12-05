const default_data = getQueryParams();
const {
  CustomerName,
  Model,
  RefNo,
  ProjectID
} = default_data;
$("#inputCustomer").val(CustomerName);
$("#inputModel").val(Model);
$("#inputRefCode").val(RefNo);

let checkSign = false
let isReviseAddClicked = false; // ตัวแปรเก็บสถานะ
let htmlSave = `
<button type="submit" class="btn btn-fw primary" id="btnReviseSave">
                            <i class="fa fa-save"></i><span class="hidden-xs-down ml-2">Save</span>
                          </button>
`
let htmlEdit = `
<button type="button" class="btn btn-fw info " id="btnPJReviseEdit">
                            <i class="fa fa-edit"></i><span class="hidden-xs-down ml-2">Edit</span>
                          </button>
`

//* Tabel Assign Part
function tbProjectRevise() {
  tbPJrevise = $("#tablePJrevise").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    // ordering: false,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "40vh",
    // todo column : No, Project Status, Part Status, Customer, Project Name, Ref No., Issue Date, SOP Date, Revise No.
    ajax: {
      url: "/project/parts",
      method: "post",
      data: {
        ProjectID: ProjectID
      },
      dataSrc: "",
    },
    columns: [{
        render: function (data, type, row, meta) {
          return meta.row + 1
        }
      },
      {
        data: "PartStatus",
        render: function (data, type, row) {
          let status = {
            css: "",
            name: ""
          };
          if (row.Active == false) status = {
            css: "",
            name: "Cancel"
          };
          else if (data == 1) status = {
            css: "grey-600",
            name: "Issue"
          };
          else if (data == 2) status = {
            css: "warn",
            name: "Checked"
          };
          else if (data == 3) status = {
            css: "blue",
            name: "Approved"
          };
          else if (data == 4) status = {
            css: "green",
            name: "Completed"
          };
          let html = `<span class="label ${status.css} w-75">${status.name}</span>`;
          return html;
        },
      },
      {
        data: "PartCode",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "PartName",
        render: function (data, type, row) {
          return data || "-";
        },
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
        data: "ReceiveDate",
        render: function (data, type, row) {
          let ReceiveDate = (row.ReceiveDate) ? formatDateName(data) : ''
          return ReceiveDate
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
        data: "ReviseNo"
      }
    ],
    layout: {
      topStart: {
        // buttons: ["copy", "csv", "excel", "pdf", "print"],
        buttons: [{
          extend: "csvHtml5",
          text: "Export CSV",
          className: "btn dark",
          // action: function () {
          //   exportToExcel();  // เรียกฟังก์ชัน exportToExcel ที่เราเขียนไว้
          // } // Add custom class here
        }, ],
      },
    },
  });
}

//* Get Data Revise Part
function getReviseManagement() {
  let item = tbPJrevise.rows(".selected").data()[0] || null;
  $("#inputPartcode").val(item?.PartCode);
  $("#inputPartname").val(item?.PartName);
  $("#inputRecDate").val(formatFullMonthToDate(item?.ReceiveDate));
  $("#txtareaDrawingRev").val(item?.DrawingRev);
  $("#showIssue").val(`${item?.IssueBy} ${item?.IssueSignTime ? formatDateName(item?.IssueSignTime): ""}`);
  $("#showCheck").val(`${item?.CheckBy} ${item?.CheckSignTime ? formatDateName(item?.CheckSignTime): ""}`);
  $("#showApprove").val(`${item?.ApproveBy} ${item?.ApproveSignTime ? formatDateName(item?.ApproveSignTime) : ""}`);
  $("#nameFile").text(item?.DocName ? item?.DocName == "-" ? "Upload Doc." : item?.DocName : "Upload Doc.");
  $("#tooltipNameFile").attr("title", item?.DocName ? item?.DocName == "-" ? "Upload Doc." : item?.DocName : "Upload Doc.");

  if (item?.DocFilePath) {
    $("#btnPJReviseDoc").prop("disabled", false)
    viewPDF(item?.DocFilePath)
  } else {
    $("#btnPJReviseDoc").prop("disabled", true)
    viewPDF(null)
  }
}

//* View Doc
function viewPDF(url) {
  if (url) {
    $(document).on("click", "#btnPJReviseDoc", function () {
      Swal.fire({
        title: "",
        html: `
        <div class="d-flex align-items-center justify-content-end mr-4">
        <button type="button" class="btn btn-fw dark info d-none" id="btnPJRevisePrint">
                            <i class="fa fa-print"></i><span class="hidden-xs-down ml-2">Print</span>
                          </button>
                          </div>
        <div id="pdfContainer" style="height: 100%; overflow: hidden; padding-top: 25px;">
                  <object id="pdfViewer" data="${url}#toolbar=0" type="application/pdf" style="width: 100%; height: 100%;"></object>
              </div>`,
        width: "70%",
        heightAuto: false,
        showCloseButton: true,
        showConfirmButton: false,
        padding: "10px",
        didOpen: () => {
          //* Popup
          const container = document.querySelector(".swal2-popup");
          if (container) {
            container.style.maxHeight = "calc(100vh - 40px)";
          }

          //* Container
          const pdfContainer = document.getElementById("pdfContainer");
          if (pdfContainer) {
            pdfContainer.style.height = "calc(100vh - 80px)";
            pdfContainer.style.margin = "0";
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

      //* Check User สิทธิในการ Print
      let data = tbPJrevise.rows(".selected").data()[0] || null;
      let DepartmentID = getCookie("DepartmentID"); // NotificationPPC()

      if (DepartmentID == 3 || DepartmentID == 19) {
        if (isReviseAddClicked === true) {
          $("#btnPJRevisePrint").addClass("d-none");
        } else {
          if (data?.PartStatus == 4) {
            $("#btnPJRevisePrint").removeClass("d-none");
          } else {
            $("#btnPJRevisePrint").addClass("d-none");
          }
        }
      } else {
        $("#btnPJRevisePrint").addClass("d-none");
      }
    });
  }
}

//* Sign User
function signUser() {
  $(".btn-swal-sign").unbind();
  $(".btn-swal-sign").on("click", function () {
    let id = $(this).attr("id");
    let checkSign = $(this).attr("checkSign");
    let selectedRows = tbPJrevise.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก

    //* รับ ค่าจาก table
    let getItem = tbPJrevise.rows(".selected").data()[0] || null;
    //* ส่งเข้า script function
    swalalertSign(id, getItem, checkSign, selectedRows);
  });
}

$(document).ready(function () {

  let getDepartmentName = getCookie("DepartmentName");
  $("#departmentName").html(getDepartmentName);
  tbProjectRevise()
  select2MultipleAutoAdd("selectEmail");
  select2Single("selectCustomer");

  let DepartmentID = getCookie("DepartmentID"); // NotificationPPC()

  if (DepartmentID == 3 || DepartmentID == 19) {
    $("#btnPJReviseAdd").removeClass("d-none");
  } else {
    $("#btnPJReviseAdd").addClass("d-none");
  }

  //*======================================== On Click  =======================================
  //* Select Table
  $("#tablePJrevise tbody").on("click", "tr", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#modalPJRevisemanagement").addClass("d-none");
      $("#btnReviseHistory,.show-edit").addClass("d-none");

    } else {
      $("#tablePJrevise tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#modalPJRevisemanagement").removeClass("d-none");
      $("#btnReviseHistory,.show-edit").removeClass("d-none");

    }

    $("#btnPJReviseDel").removeClass("d-none");

    isReviseAddClicked = false; // เปลี่ยนสถานะเป็นไม่กด Add

    //* Clean File PDF
    window.uploadedFile = null;
    $("#fileUpload").val("");

    getReviseManagement()
    $("#btnEditAndSave").html(htmlEdit);

    //* Check Disabled และ Hide Show
    $(".dis_input,#btnUpload").prop("disabled", true);
    let item = tbPJrevise.row(".selected").data(); // ดึงข้อมูลของแถวที่ถูกเลือก
    if (DepartmentID == 3 || DepartmentID == 19) {

      if (item?.Active) {
        if (item?.PartStatus == 3) {
          $("#btnPJReviseEdit").prop("disabled", false);
          $("#btnPJReviseDel").prop("disabled", true);
          $("#btnPJReviseStamping").removeClass("d-none");

          if (item?.DocFilePath == "") {
            $("#btnPJReviseStamping").prop("disabled", true);
          } else {
            $("#btnPJReviseStamping").prop("disabled", false);
          }
          $("#btnPJReviseStamping").removeClass("d-none");

          $("#btnSignIssue, #btnSignCheck, #btnSignApprove").prop("disabled", true);

        } else if (item?.PartStatus == 4) {
          $("#btnPJReviseEdit").prop("disabled", false);
          $("#btnPJReviseDel").prop("disabled", true);
          $("#btnPJReviseStamping").addClass("d-none");
          $("#btnSignIssue, #btnSignCheck, #btnSignApprove").prop("disabled", true);
        } else {
          $("#btnPJReviseEdit").prop("disabled", false);
          $("#btnPJReviseDel").prop("disabled", false);

          $("#btnSignIssue, #btnSignCheck, #btnSignApprove").prop("disabled", false);
          $("#btnPJReviseStamping").addClass("d-none");
        }
      } else {
        $("#btnPJReviseEdit").prop("disabled", true);
        $("#btnPJReviseDel").prop("disabled", true);
        $("#btnSignIssue, #btnSignCheck, #btnSignApprove").prop("disabled", true);
        $("#btnPJReviseStamping").addClass("d-none");
      }
    } else {

      $("#btnPJReviseAdd").hide()
      $("#btnEditAndSave").hide()
      $("#btnPJReviseDel").hide()
      $("#btnSignIssue").prop('disabled', true)
      $("#btnSignCheck").prop('disabled', true)
      $("#btnSignApprove").prop('disabled', true)

    }

  });
  //* Add
  $(document).on("click", "#btnPJReviseAdd", function () {
    isReviseAddClicked = true;
    scrollPageTo("modalPJRevisemanagement");
    $("#btnEditAndSave").html(htmlSave);

    //* Hide Show
    $("#btnPJReviseDel, .show-edit, #btnPJReviseCalcel").addClass("d-none");
    $("#btnPJReviseDoc").removeClass("d-none").prop("disabled", true);
    $("#modalPJRevisemanagement").removeClass("d-none");
    $("#tablePJrevise tbody tr").removeClass("selected");
    $("#btnReviseHistory").addClass("d-none");
    $("#btnPJReviseStamping").addClass("d-none");

    //* Disable
    $(".dis_input,#btnUpload").prop("disabled", false);
    $("#btnSignIssue").prop('disabled', false)

    //* Clean Data
    $("#modalPJRevisemanagement input, #modalPJRevisemanagement select").val("");
    $("#txtareaDrawingRev").val("")
    $("#fileName").val("-");
    $("#nameFile").text("Upload Doc.");

    //* Save
    $("#btnReviseSave").unbind();
    $("#btnReviseSave").on("click", function () {
      let valIssueBy = $("#showIssue").val()

      if (!valIssueBy) {
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "Warning",
          text: "กรุณา Sign Issued By",
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
        return false;
      }
      let pdfFile = window.uploadedFile

      let PartCode = $("#inputPartcode").val()
      let PartName = $("#inputPartname").val()
      let ReceiveDate = $("#inputRecDate").val()
      let DrawingRev = $("#txtareaDrawingRev").val()
      let IssueBy = getUserID
      let IssueSignTime = getDate
      let DocName = pdfFile ? pdfFile.name : "-"

      let formData = new FormData();
      formData.append("ProjectID", ProjectID);
      formData.append("PartCode", PartCode);
      formData.append("PartName", PartName);
      formData.append("ReceiveDate", ReceiveDate); // ต้องแปลงเป็น JSON
      formData.append("DrawingRev", DrawingRev);
      formData.append("IssueBy", IssueBy); // เพิ่มไฟล์ PDF
      formData.append("IssueSignTime", IssueSignTime);
      formData.append("DocName", DocName)
      formData.append("part_doc", pdfFile);

      $.ajax({
        type: "POST",
        url: "/project/part/add",
        data: formData,
        processData: false, // ต้องเป็น false สำหรับ FormData
        contentType: false, // ต้องเป็น false สำหรับ FormData
        success: function (response) {

          tbPJrevise.ajax.reload(null, false);
          $("#tablePJrevise")
            .off("draw.dt")
            .on("draw.dt", function () {
              $("#tablePJrevise tbody tr").removeClass("selected");

            });

          Notification()
          $("#modalPJRevisemanagement").addClass("d-none");
          window.uploadedFile = null;
          $("#fileUpload").val("");

          Swal.fire({
            position: 'center',
            icon: 'success',
            title: response.message,
            showConfirmButton: false,
            timer: 1500
          });
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
    });
  });

  //* Edit
  $(document).on("click", "#btnPJReviseEdit", function () {
    let data = tbPJrevise.rows(".selected").data()[0] || null;
    let ProjectPartID = data.ProjectPartID;
    let selectedRows = tbPJrevise.rows(".selected").indexes().toArray(); // เก็บ index 
    $("#btnEditAndSave").html(htmlSave);
    if (data?.PartStatus == 4) {
      $("#nameFile").text("Upload Doc.");
    }

    //* Hide Show
    $("#btnPJReviseCalcel").removeClass("d-none");
    $(".show-edit").addClass("d-none");
    $("#btnPJReviseStamping").addClass("d-none");

    //* Disabled
    $(".dis_input, #btnUpload, #btnSignIssue").prop("disabled", false);

    //* Clean 
    $("#showIssue").val("")
    $("#showCheck").val("")
    $("#showApprove").val("")
    window.uploadedFile = null;
    $("#fileUpload").val("");

    //* Sign User
    $(".btn-swal-sign").unbind();
    $(".btn-swal-sign").on("click", function () {

      let id = $(this).attr("id");
      let checkSign = $(this).attr("checkSign");
      let selectedRows = tbPJrevise.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก

      //* รับ ค่าจาก table
      let getItem = null;
      //* ส่งเข้า script function
      swalalertSign(id, getItem, checkSign, selectedRows);
    });

    //* Save
    $("#btnReviseSave").unbind();
    $("#btnReviseSave").on("click", function () {

      let valIssueBy = $("#showIssue").val()

      if (!valIssueBy) {
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "Warning",
          text: "กรุณา Sign Issued By",
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
        return false;
      }
      let pdfFile = window.uploadedFile
      let PartCode = $("#inputPartcode").val()
      let PartName = $("#inputPartname").val()
      let ReceiveDate = $("#inputRecDate").val()
      let DrawingRev = $("#txtareaDrawingRev").val()
      let IssueBy = getUserID
      let DocName = ""
      let Ischange = 0
      let IssueSignTime = inputSignDateRevise

      if (data?.PartStatus == 4) {
        if (pdfFile) {
          DocName = pdfFile.name
          Ischange = 1
        } else {
          DocName = ""
          Ischange = 1
        }
      } else {
        if (pdfFile) {
          DocName = pdfFile.name
          Ischange = 1
        } else {
          DocName = ""
          Ischange = 0
        }
      }

      let formData = new FormData();
      formData.append("ProjectID", ProjectID);
      formData.append("ProjectPartID", ProjectPartID);
      formData.append("PartCode", PartCode);
      formData.append("PartName", PartName);
      formData.append("ReceiveDate", ReceiveDate); // ต้องแปลงเป็น JSON
      formData.append("DrawingRev", DrawingRev);
      formData.append("IssueBy", IssueBy); // เพิ่มไฟล์ PDF
      formData.append("DocName", DocName)
      formData.append("part_doc", pdfFile);
      formData.append("Ischange", Ischange);
      formData.append("IssueSignTime", IssueSignTime);

      $.ajax({
        type: "PUT",
        url: "/project/part/edit",
        processData: false, // ต้องเป็น false สำหรับ FormData
        contentType: false, // ต้องเป็น false สำหรับ FormData
        data: formData,
        success: function (response) {

          tbPJrevise.ajax.reload(null, false);
          $("#tablePJrevise")
            .off("draw.dt")
            .on("draw.dt", function () {
              reselectRows($("#tablePJrevise").DataTable(), selectedRows);
              signUser()
              let data = tbPJrevise.rows(".selected").data()[0] || null;
              if (data?.PartStatus == 3) {
                if (data?.DocFilePath == "") {
                  $("#btnPJReviseStamping").prop("disabled", true);
                } else {
                  $("#btnPJReviseStamping").prop("disabled", false);
                }
                $("#btnPJReviseStamping").removeClass("d-none");
              } else {
                $("#btnPJReviseStamping").addClass("d-none");
              } // getReviseManagement(data.ProjectPartID)

            });

          $("#btnSignIssue, #btnSignCheck, #btnSignApprove").prop("disabled", false);

          window.uploadedFile = null;
          $("#fileUpload").val("");
          $("#btnEditAndSave").html(htmlEdit);
          $("#btnPJReviseCalcel").addClass("d-none");
          $(".show-edit").removeClass("d-none");
          $(".dis_input,#btnUpload").prop("disabled", true);
          $("#btnPJReviseDel").prop("disabled", false);

          Swal.fire({
            position: 'center',
            icon: 'success',
            title: response.message,
            showConfirmButton: false,
            timer: 1500
          });
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
      checkSign = false
    });
  });

  //* Delete
  $("#btnPJReviseDel").unbind();
  $("#btnPJReviseDel").on("click", function () {
    let data = tbPJrevise.row(".selected").data();
    let ProjectPartID = data.ProjectPartID;
    Swal.fire({
      title: "ยืนยันการลบข้อมูล",
      text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        // todo ajax
        $.ajax({
          type: "DELETE",
          url: "/project/part/delete",
          data: JSON.stringify({
            ProjectPartID
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",

          success: function (response) {
            // fill input
            Notification()
            tbPJrevise.ajax.reload(null, false);
            $("#tablePJrevise")
              .off("draw.dt")
              .on("draw.dt", function () {
                $("#tablePJrevise tbody tr").removeClass("selected");
              });
            $("#modalPJRevisemanagement").addClass("d-none");
            Swal.fire({
              position: 'center',
              icon: 'success',
              title: response.message,
              showConfirmButton: false,
              timer: 1500
            });
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
    });
  });

  //* Cancel
  $("#btnPJReviseCalcel").unbind();
  $("#btnPJReviseCalcel").on("click", function () {

    let item = tbPJrevise.row(".selected").data();
    viewPDF(item.DocFilePath ? item.DocFilePath : null);
    $("#inputPartcode").val(item.PartCode);
    $("#inputPartname").val(item.PartName);
    $("#inputRecDate").val(formatFullMonthToDate(item.ReceiveDate));
    $("#txtareaDrawingRev").val(item.DrawingRev);
    $("#showIssue").val(`${item.IssueBy} ${item.IssueSignTime ? formatDateName(item.IssueSignTime): ""}`);
    $("#showCheck").val(`${item.CheckBy} ${item.CheckSignTime ? formatDateName(item.CheckSignTime): ""}`);
    $("#showApprove").val(`${item.ApproveBy} ${item.ApproveSignTime ? formatDateName(item.ApproveSignTime) : ""}`);
    $("#nameFile").text(item?.DocName ? item?.DocName == "-" ? "Upload Doc." : item?.DocName : "Upload Doc.");

    $(".show-edit").removeClass("d-none");
    $("#fileName").val(item?.DocName ? item?.DocName : "-");

    if (item?.PartStatus == 3) {
      $("#btnPJReviseStamping").removeClass("d-none");
      if (item?.DocFilePath == "") {
        $("#btnPJReviseStamping").prop("disabled", true);
      } else {
        $("#btnPJReviseStamping").prop("disabled", false);
      }
    }

    if (item?.PartStatus == 4) {
      $("#nameFile").text(item?.DocName);
      $("#tooltipNameFile").attr("title", item?.DocName);
    }

    $("#btnEditAndSave").html(htmlEdit);
    $("#btnPJReviseCalcel").addClass("d-none");
    $(".dis_input,#btnUpload").prop("disabled", true);
    signUser()



  });

  //* Revise History
  $("#btnReviseHistory").unbind();
  $("#btnReviseHistory").on("click", function () {
    let item = tbPJrevise.row('.selected').data();
    const data = {
      CustomerName: CustomerName,
      Model: Model,
      RefNo: RefNo,
      PartCode: item.PartCode,
      PartName: item.PartName,
      ProjectPartID: item.ProjectPartID,
    };

    // แปลงข้อมูลเป็น query string
    const queryString = new URLSearchParams(data).toString();
    window.location.href = `/reviseHistory?${queryString}`;
  });

  //* Click Stamping
  $(document).on("click", "#btnPJReviseStamping", function () {
    let item = tbPJrevise?.row(".selected").data(); // ดึงข้อมูลของแถวที่ถูกเลือก
    const data = {
      CustomerName: CustomerName,
      Model: Model,
      RefNo: RefNo,
      ProjectID: ProjectID,
      ProjectPartID: item.ProjectPartID,
      ApproveBy: item.ApproveBy,
      ApproveSignTime: formatDateName(item.ApproveSignTime),
      DocFilePath: item.DocFilePath
    };

    // แปลงข้อมูลเป็น query string
    const queryString = new URLSearchParams(data).toString();
    window.location.href = `/stampApprove?${queryString}`;

  });

  //* Print
  $(document).on("click", "#btnPJRevisePrint", function () {
    let item = tbPJrevise.row(".selected").data(); // ดึงข้อมูลของแถวที่ถูกเลือก
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

  //* Upload File
  $("#btnUpload").unbind();
  $("#btnUpload").on("click", function () {
    $("#fileUpload").click();
  });

  //*======================================== On Change  =======================================
  //* Change File
  $(document).on("change", "#fileUpload", function () {
    window.uploadedFile = null;
    let file = $("#fileUpload")[0].files[0];
    if (file && file.type === "application/pdf") {
      window.uploadedFile = file;
      let pdfUrl = URL.createObjectURL(window.uploadedFile);
      $("#btnPJReviseDoc").prop("disabled", false)
      viewPDF(pdfUrl); // แสดง PDF ตาม URL ที่สร้าง
      $("#nameFile").text(file?.name);
      $("#tooltipNameFile").attr("title", file?.name);


    } else {
      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Warning",
        text: "กรุณาอัพโหลดไฟล์ PDF เท่านั้น",
        showConfirmButton: true,
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
      });
      $("#fileUpload").val("Upload Doc."); // Clear input
    }
  });


  //*======================================= Sign =======================================
  signUser()

});