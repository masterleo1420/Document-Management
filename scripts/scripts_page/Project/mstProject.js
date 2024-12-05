// const getValue = require('./moduleA');

// * Table Project List
function tbProjectList(selectedMonth = "", selectedYear = "") {
  tbPJlist = $("#tablePJmaster").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    // ordering: false,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "40vh",
    ajax: {
      url: "/project/",
      method: "post",
      dataSrc: "",
      data: {
        IssueMonth: selectedMonth,
        IssueYear: selectedYear
      },

    },
    columns: [{
        data: "ItemNo",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "ProjectStatus",
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
            name: "SOP Approved"
          };
          let html = `<span class="label ${status.css} w-75">${status.name}</span>`;
          return html;

        },
      },
      {
        data: "ConcludePartStatus",
        render: function (data, type, row) {
          let status = {
            css: "",
            name: ""
          };
          if (data == 2) status = {
            css: "green",
            name: "Completed"
          };
          else status = {
            css: "danger",
            name: "Pending"
          };
          let html = `<span class="label ${status.css} w-75">${status.name}</span>`;
          return html;
        },
      },
      {
        data: "CustomerName",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "Model",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "RefCode",
        render: function (data, type, row) {
          return data || "-";
        },
      },
      {
        data: "IssueDate",
        render: function (data, type, row) {
          let IssueDate = (row.IssueDate) ? formatDateName(data) : ''
          return IssueDate
        },
      },
      {
        data: "SopApproveSignTime",
        render: function (data, type, row) {
          let SopApproveSignTime = (row.SopApproveSignTime) ? formatDateName(data) : ''
          return SopApproveSignTime
        },
      },
      {
        data: "ReviseNo",
        render: function (data, type, row) {
          return data || "0";
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

// * Project Management
function getProjectManagement() {
  let item = tbPJlist.rows(".selected").data()[0] || null;
  $("#selectCustomer").val(item?.CustomerName).trigger("change");
  $("#inputRefCode").val(item?.RefCode);
  $("#inputModel").val(item?.Model);
  $("#inputSOPDate").val(item?.SOPDate ? formatFullMonthToDate(item?.SOPDate) : "");
  $("#inputTotal").val(item?.TotalPart ? item?.TotalPart : 0);
  $("#showIssue").val(`${item?.IssueBy} ${item?.IssueSignTime ? formatDateName(item?.IssueSignTime): ""}`);
  $("#showCheck").val(`${item?.CheckBy} ${item?.CheckSignTime ? formatDateName(item?.CheckSignTime): ""}`);
  $("#showApprove").val(`${item?.ApproveBy} ${item?.ApproveSignTime ? formatDateName(item?.ApproveSignTime) : ""}`);
  $("#showApproveSOP").val(`${item?.SopApproveBy} ${item?.SopApproveSignTime ? formatDateName(item?.SopApproveSignTime) : ""}`);
  $("#selectEmail").val(item?.SendEmail ? JSON.parse(item?.SendEmail) : []).trigger("change");

}

// * Disable Sign
function signDis() {
  let data = tbPJlist.rows(".selected").data()[0] || null;
  if (data) {
    if (data.ProjectStatus == 3 || data.ProjectStatus == 4) {
      $("#inputModel").prop("disabled", true)
      $("#selectCustomer").prop("disabled", true).trigger("change");
      $("#inputSOPDate").prop("disabled", true)

    } else {
      $("#inputModel").prop("disabled", false)
      $("#selectCustomer").prop("disabled", false).trigger("change");
      $("#inputSOPDate").prop("disabled", false)

    }
  }
}

// * กล Link ใน Mail เลือก Table
function mailToMapDataTable() {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let ProjectID = urlParams.get('ProjectID');

  setTimeout(function () {
    let data = tbPJlist.rows().data().toArray();
    let rowIndex = -1;

    data.forEach((item, index) => {
      if (item.ProjectID == ProjectID) {
        rowIndex = index;
      }
    });


    let rowNode = tbPJlist.row(rowIndex).node();
    $(rowNode).click(); // คลิกที่แถว

    // เลื่อนไปยังแถวที่เลือก
    let tableWrapper = $('.dt-scroll-body');
    let rowPosition = $(rowNode).position().top;

    tableWrapper.animate({
      scrollTop: tableWrapper.scrollTop() + rowPosition - tableWrapper.height() / 2
    }, 100); // ปรับความเร็วของการเลื่อนตามต้องการ

    scrollPageTo("modalPJmanagement");
  }, 200);
}

$(document).ready(function () {

  let DepartmentID = getCookie("DepartmentID"); // NotificationPPC()
  tbProjectList()

  //*======================================== Dropdown =======================================
  dropdownCustomer(".select-customer");
  dropdownEmail(".select-department");


  //*======================================== On Click  =======================================
  //* Select Table 
  $("#tablePJmaster tbody").on("click", "tr", function () {
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      // $("#btnPJdel").addClass("d-none");
      $("#modalPJmanagement").addClass("d-none");

    } else {
      $("#tablePJmaster tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      // $("#btnPJdel").removeClass("d-none");
      $("#modalPJmanagement").removeClass("d-none");
    }

    // ลองเอาฟังก์ชันนี้ออกเพื่อตรวจสอบการทำงาน
    let htmlEdit = `
          <button type="button" class="btn btn-fw info show-edit" id="btnPJedit">
               <i class="fa fa-edit"></i><span class="hidden-xs-down ml-2">Edit</span>
          </button>
`
    getProjectManagement()

    $("#btnEditAndSave").html(htmlEdit);
    $(".show-edit,.email").removeClass("d-none");
    $("#inputModel").prop("disabled", true)
    $("#selectCustomer").prop("disabled", true).trigger("change");
    $("#inputSOPDate").prop("disabled", true)

    // $("#btnSignIssue, #btnSignCheck, #btnSignApprove, #btnSignApproveSOP").prop("disabled", true);
    let item = tbPJlist.row('.selected').data();

    if (DepartmentID == 3 || DepartmentID == 19) {
      if (item?.Active) {
        if (item.ProjectStatus == 4 || item.ProjectStatus == 3) {
          $("#btnPJedit").prop("disabled", true)
          $("#btnPJdel").prop("disabled", true)
        } else {
          $("#btnPJedit").prop("disabled", false)
          $("#btnPJdel").prop("disabled", false)
        }

        $("#btnSignIssue, #btnSignCheck, #btnSignApprove, #btnSignApproveSOP").prop("disabled", false);

      } else {
        $("#btnSignIssue, #btnSignCheck, #btnSignApprove, #btnSignApproveSOP").prop("disabled", true);
        $("#btnPJedit").prop("disabled", true)
        $("#btnPJdel").prop("disabled", true)

      }
    } else {
      $("#btnPJadd").hide()
      $("#btnEditAndSave").hide()
      $("#btnPJdel").hide()
      $("#selectEmail").prop("disabled", true);
      $("#btnPJsend").prop("disabled", true);
      $("#btnSignIssue").prop("disabled", true);
      $("#btnSignCheck").prop("disabled", true);
      $("#btnSignApprove").prop("disabled", true);
      $("#btnSignApproveSOP").prop("disabled", true);
    }
  });

  //* Add
  $(document).on("click", "#btnPJadd", function () {
    //* Add Button
    let htmlSave = `
  <button type="submit" class="btn btn-fw primary" id="btnPJsave">
                        <i class="fa fa-save"></i><span class="hidden-xs-down ml-2">Save</span>
                      </button>
  `
  $("#btnEditAndSave").html(htmlSave);

    //* Scroll Page
    scrollPageTo("modalPJmanagement");

    //* Hide Show
    $(".show-edit").addClass("d-none");
    $(".email").addClass("d-none");
    $("#modalPJmanagement").removeClass("d-none");
    $("#tablePJmaster tbody tr").removeClass("selected");
    
    //* Disable
    $("#inputModel").prop("disabled", false)
    $("#selectCustomer").prop("disabled", false).trigger("change");
    $("#inputSOPDate").prop("disabled", false)
    $("#btnSignIssue").prop("disabled", false);

    //* Clean Data
    $("#modalPJmanagement input, #modalPJmanagement select").val("");
    $("#selectCustomer").val("").trigger("change")
    $("#inputModel").val("")
    $("#showIssue").val("")
    $("#inputSOPDate").val("")
    $("#selectEmail").val("")

    //* Save 
    $("#btnPJsave").unbind();
    $("#btnPJsave").on("click", function () {
      let CustomerName = $("#selectCustomer").val()
      let Model = $("#inputModel").val()
      let SOPDate = $("#inputSOPDate").val()
      let IssueBy = getUserID
      let IssueSignTime = getDate
      let SendEmail = $("#selectEmail").val() || ""
      let inputSignIssued = $("#showIssue").val()

      if (!inputSignIssued) {
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
      $.ajax({
        type: "POST",
        url: "/project/add",
        data: JSON.stringify({
          CustomerName,
          Model,
          IssueBy,
          IssueSignTime,
          SendEmail,
          SOPDate
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",

        success: function (response) {

          tbPJlist.ajax.reload(null, false);
          $("#tablePJmaster")
            .off("draw.dt")
            .on("draw.dt", function () {
              $("#tablePJmaster tbody tr").removeClass("selected");
            });

          $("#modalPJmanagement").addClass("d-none");
          Notification()

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
  $(document).on("click", "#btnPJedit", function () {
    let data = tbPJlist.rows(".selected").data()[0] || null;
    let selectedRows = tbPJlist.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก

  //* Add Button
    let htmlSave = `
       <button type="submit" class="btn btn-fw primary" id="btnPJsave">
                        <i class="fa fa-save"></i><span class="hidden-xs-down ml-2">Save</span>
                      </button>
  `
    let htmlEdit = `
       <button type="button" class="btn btn-fw info show-edit" id="btnPJedit">
                        <i class="fa fa-edit"></i><span class="hidden-xs-down ml-2">Edit</span>
       </button>
  `
    $("#btnEditAndSave").html(htmlSave);

  //* Disable
    $("#inputModel").prop("disabled", false)
    $("#selectCustomer, #selectEmail").prop("disabled", false).trigger("change");
    $("#inputSOPDate").prop("disabled", false)
    signDis()

  //* Save
    $("#btnPJsave").unbind();
    $("#btnPJsave").on("click", function () {

      let ProjectID = data.ProjectID;
      let CustomerName = $("#selectCustomer").val();
      let Model = $("#inputModel").val();
      let SOPDate = $("#inputSOPDate").val();
      let SendEmail = $("#selectEmail").val() || ""

      $.ajax({
        type: "PUT",
        url: "/project/edit",
        data: JSON.stringify({
          ProjectID,
          CustomerName,
          Model,
          SendEmail,
          SOPDate
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
          tbPJlist.ajax.reload(null, false);
          $("#tablePJmaster")
            .off("draw.dt")
            .on("draw.dt", function () {
              reselectRows($("#tablePJmaster").DataTable(), selectedRows);
            });

          $("#btnEditAndSave").html(htmlEdit);

          $("#inputModel").prop("disabled", true)
          $("#selectCustomer").prop("disabled", true).trigger("change");
          $("#inputSOPDate").prop("disabled", true)

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

    // ************************************** send email

    $(".sendMail").unbind();
    $(".sendMail").on("click", function () {
      let id = $(this).closest(".input-group").find("select").attr("id");
      let checkRout = $(this).attr("checkRout");

      //* รับ ค่าจาก table
      let getSelectTb = tbPJlist.rows(".selected").data()[0] || null;

      //* ส่งเข้า script function
      sendMail(id, checkRout, getSelectTb);
    });

  });

  //* Delete
  $(document).on("click", "#btnPJdel", function () {
    let data = tbPJlist.rows(".selected").data()[0] || null;
    let ProjectID = data ? data.ProjectID : "";

    if (!ProjectID) {
      Swal.fire({
        position: 'center',
        icon: 'warning',
        title: 'Warning',
        text: 'กรุณาเลือกข้อมูลที่ต้องการลบ',
        showConfirmButton: true,
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      })
      return false
    }

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

        $.ajax({
          type: "DELETE",
          url: "/project/delete",
          data: JSON.stringify({
            ProjectID
          }),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function (response) {

            Notification()

            tbPJlist.ajax.reload(null, false);
            $("#tablePJmaster")
              .off("draw.dt")
              .on("draw.dt", function () {
                $("#tablePJmaster tbody tr").removeClass("selected");
              });

            $("#modalPJmanagement").addClass("d-none");

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

  //* Assign Part
  $(document).on("click", "#btnRevise", function () {
    // $("#tablePJmaster tbody").find("tr.selected").removeClass("selected");
    let item = tbPJlist.row('.selected').data();
    const data = {
      CustomerName: item.CustomerName,
      Model: item.Model,
      RefNo: item.RefCode,
      ProjectID: item.ProjectID,
    };

    // แปลงข้อมูลเป็น query string
    const queryString = new URLSearchParams(data).toString();
    window.location.href = `/projectRevise?${queryString}`;
  });

  //* Sign User
  $(".btn-swal-sign").unbind();
  $(".btn-swal-sign").on("click", function () {
    let id = $(this).attr("id");
    let checkSign = $(this).attr("checkSign");
    let selectedRows = tbPJlist.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก

    //* รับ ค่าจาก table
    getItem = tbPJlist.rows(".selected").data()[0];
    //* ส่งเข้า script function
    swalalertSign(id, getItem, checkSign, selectedRows);
  });

  //*======================================== On Change  =======================================
  //* Search Month
  $("#searchMonth").on("change", function () {
    $("#modalPJmanagement").addClass("d-none");
    $("#tablePJmaster tbody tr").removeClass("selected");
    let selectedMonth = $("#searchMonth").val();
    let [year, month] = selectedMonth.split("-");
    tbProjectList(month, year);
  });

  //*======================================== Mail =======================================
  //* เรียกใช้ Link ใน Mail เลือก Table
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  if (urlParams.size > 0) {
    mailToMapDataTable()
  }

  //* Send Mail
  $(".sendMail").unbind();
  $(".sendMail").on("click", function () {
    let id = $(this).closest(".input-group").find("select").attr("id");
    let checkRout = $(this).attr("checkrout");

    let getItem = tbPJlist.rows(".selected").data()[0] || null;

    sendMail(id, checkRout, getItem);
  });

  //*======================================== Check User =======================================
  //* Check User สิทธิในการเข้าถึงหน้า Project
  if (!(DepartmentID == 7 || DepartmentID == 11 || DepartmentID == 3 || DepartmentID == 19)) {
    $("#view").html(`
    <div style="
               display: flex; 
               flex-direction: column; 
               align-items: center; 
               justify-content: center; 
               height: 100vh; 
               background: linear-gradient(135deg, #f8f9fa, #e0e0e0);
               font-family: 'Arial', sans-serif;
           ">
               <h1 style="
                   color: #ff4d4f; 
                   font-size: 48px; 
                   margin-bottom: 20px;
                   text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
               ">
                   🚫 ไม่มีสิทธิ์เข้าถึง
               </h1>
               
           </div>
 `)

  }

  //* Check User แผนกที่กดปุ่ม Add ได้
  if (DepartmentID == 3 || DepartmentID == 19) {
    $("#btnPJadd").removeClass("d-none");
  } else {
    $("#btnPJadd").addClass("d-none");
  }

});