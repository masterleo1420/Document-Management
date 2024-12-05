let isProgramChange = false;
let defaultDoc = [];
let defaultCheckPoint = [];
let defaultDeptECN = [];
let valplanJudgement = 0;
let buttonEvent = "add";
let deletedDeptValues = {};
const btn_hide = $(
  "#btnECNissue,#btnECNdel,#btn_saveECNIssue,#btn_saveECNApprove"
);

//SECTION function

// NOTE fillTalble
function tbEcnIssue(selectedMonth = "", selectedYear = "") {
  tableReqECN = $("#tableReqECN").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    // ordering: false,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "40vh",
    ajax: {
      url: "/ecn/",
      method: "post",
      dataSrc: "",
      data: { IssueMonth: selectedMonth, IssueYear: selectedYear },
    },
    columns: [
      {
        data: "NO",
        render: function (data, type, row, meta) {
          return data;
        },
      },
      {
        data: "ECNStatus",
        render: function (data, type, row, meta) {
          let status = { css: "", name: "" };
          if (row.Active == 0) status = { css: "", name: "Cancel" };
          else if (data == 1) status = { css: "grey-700", name: "Issue" };
          else if (data == 2)
            status = { css: "text-white blue-300", name: "Wait Approve" };
          else if (data == 3) status = { css: "green", name: "Complete" };
          else if (data == 4) status = { css: "danger", name: "Not Appove" };
          let html = `<span class="label ${status.css} w-75">${status.name}</span>`;
          return html;
        },
      },
      {
        data: "RefCode",
      },
      {
        data: "CustomerName",
      },
      {
        data: "PartCode",
      },
      {
        data: "PartName",
      },
      {
        data: "ProcessName",
      },
      {
        data: "IssueBy",
      },
      {
        data: "IssueDate",
        render: function (data, meta, row) {
          return data ? formatDateName(data) : "";
        },
      },
      {
        data: "CompleteDate",
        render: function (data, meta, row) {
          return data ? formatDateName(data) : "";
        },
      },
      {
        data: "Remark",
      },
    ],
    layout: {
      topStart: {
        // buttons: ["copy", "csv", "excel", "pdf", "print"],
        buttons: [
          {
            extend: "csvHtml5",
            text: "Export CSV",
            className: "btn dark", // Add custom class here
          },
        ],
      },
    },
  });
}
//NOTE dropdownProcess
function dropdownProcess() {
  $.ajax({
    type: "post",
    url: "/dropdown/process",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (res) {
      let process = res.Data;

      let select = $(`#selectProcess`);
      select.empty();
      process.forEach((item) => {
        select.append(`<option value="${item.Name}">${item.Name}</option>`);
      });
    },
  });
}
//NOTE defaultEngineerProcess
function genDefaultEngineerProcess(topicName) {
  $.ajax({
    type: "post",
    url: "/setting/",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify({
      TopicName: topicName,
    }),
    success: function (res) {
      DataTableEng(JSON.parse(res[0].JsonData).Data);
    },
    error: function (error) {
      console.log(error);
    },
  });
}
//NOTE dropdownDocumentChange
function dropdownDocumentChange(selectVerifyData) {
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: "/setting/",
    data: JSON.stringify({ TopicName: "Document Change" }),
    success: function (response) {
      let { JsonData } = response[0];
      let dataJson = JSON.parse(JsonData).Data;
      $(selectVerifyData).empty();
      dataJson.forEach((v) => {
        let { Name } = v;
        $(selectVerifyData).append(`<option value="${Name}">${Name}</option>`);
      });
    },
    error: function (err) {
      console.log(err);
    },
  });
}
//NOTE documentChange
function DocumentChange(selectVerifyData, btnType) {
  // Document Change
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: "/setting/",
    data: JSON.stringify({ TopicName: "Document Change" }),
    success: function (response) {
      isProgramChange = true;
      tbDocumentChange(JSON.parse(response[0].JsonData).Data);
      let { JsonData } = response[0];
      let dataJson = JSON.parse(JsonData).Data;
      let array = [];
      dataJson.forEach((v) => {
        array.push(v.Name);
      });
      $(selectVerifyData).val(array).trigger("change");
      isProgramChange = false;
    },
    error: function (err) {
      console.log(err);
    },
  });
}
//NOTE getECNIssues
function getECNIssues() {
  let selectedData = tableReqECN.rows(".selected").data()[0];
  let ECNID = selectedData.ECNID;
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: "/ecn/issue/",
    data: JSON.stringify({ ECNID }),

    success: function (res) {
      isProgramChange = true;
      // tbEcnIssue()
      if (res) {
        let data = res[0];
        let checkPoint = data.CheckPoint;
        let engineering = JSON.parse(data.EngineeringProcess);
        defaultCheckPoint = checkPoint;
        let documentChange = JSON.parse(data.DocumentChange);
        let sendemail = data.SendEmail;
        defaultDoc = documentChange;
        let arrCheckpointID = [];
        let arrDocument = [];
        let arrEngProcess = [];

        tbDocumentChange(documentChange);
        documentChange.forEach((item) => {
          arrDocument.push(item.Name);
        });

        DataTableCheckPoint(checkPoint).then(() => {
          checkPoint.forEach((item) => {
            isProgramChange = true;
            arrCheckpointID.push(item.DepartmentID);
            $("#selectSection").val(arrCheckpointID).trigger("change");
            isProgramChange = false;
          });
        });

        // let disale  t || f
        DataTableEng(engineering);
        engineering.forEach((item) => {
          arrEngProcess.push(item.Name);
        });

        $("#inputRefNo").val(data.RefCode);
        $("#selectCustomer").val(data.CustomerName).trigger("change");
        dropdownProject("#selectModel", data.CustomerName, data.Model);
        dropdownProjectPart(
          "#selectPartNo",
          data.CustomerName,
          data.Model,
          data.PartCode
          // data.ProjectPartID
        );
        $("#show_image").attr(
          "src",
          data.ImgFilePath ? data.ImgFilePath : "/images/p0.jpg"
        );
        $("#inputDrawRev").val(data.DrawingRevise);
        $("#selectProcess").val(data.ProcessName).trigger("change");
        $("#inputPartName_Request").val(data.PartName);
        $("#inputReqDate").val(
          data.ReceivedDate ? formatDate(data.ReceivedDate) : ""
        );
        $("#inputECNDate").val(
          data.ECNIssueDate ? formatDate(data.ECNIssueDate) : ""
        );

        $("#inputPO").val(data.DeliveryPO);
        $("#inputQTY").val(data.DeliveryQty);
        $("#inputDate").val(data.DeliveryDate);
        $("#inputECNNo").val(data.DrawingNo);
        $("#customerECN").val(data.CustomerECN);
        $("#selectVerifyData").val(arrDocument).trigger("change");
        $("#inputInjDate").val(
          data.InjectionDate ? formatDate(data.InjectionDate) : ""
        );
        $("#inputSerialNum").val(data.SerialNumber);
        $("#inputFile").val(data.updateImagePath);
        $("#selectReqEmailIssue").val(JSON.parse(sendemail)).trigger("change");
        $("#inputRemark").val(data.Remark);
      }
      isProgramChange = false;
    },

    error: function (err) {
      console.log(err);
      errorText = err.responseJSON.message;

      Swal.fire({
        position: "center",
        icon: "warning",
        title: "Warning",
        text: errorText,
        showConfirmButton: true,
        confirmButtonText: "OK",
        confirmButtonColor: "#dc3545",
      });
    },
  });
}
//NOTE tableDocumentChange
function tbDocumentChange(data = []) {
  return new Promise((resolve) => {
    let disabled = buttonEvent == "view" ? "disabled" : "";
    setTimeout(() => {
      let tbodyHtml = "";
      if (data.length != 0) {
        data.forEach((item, index) => {
          item.No = index + 1;
          let id = `inputDocumentChange_${item.No}`;
          tbodyHtml += `<tr>
                    <td>${item.No}</td>
                    <td>${item.Name}</td>
                    <td><input type="date" class="form-control dis_input" id="${id}" Value="${item.Value}" ${disabled}/></td>
                                </tr>`;
        });
      } else {
        tbodyHtml = `<tr>
      <td colspan="2" class="text-center">No data available in table</td>
      </tr>`;
      }
      $("#tableAnsInsPlan tbody").html(tbodyHtml);
      resolve();
    }, 200);
  });
}
//NOTE getECNApprove
function getECNApprove() {
  // dropdownRequestDepartment("#selectConcernDept");
  let selectedData = tableReqECN.rows(".selected").data()[0];
  let ECNID = selectedData.ECNID;
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: "/ecn/approval/",
    data: JSON.stringify({ ECNID }),

    success: function (res) {
      isProgramChange = true;
      if (res[0]) {
        let data = res[0];
        let arraySignDeptECN = [];
        let a = data.SignDeptECN || [];
        let planJudgement = data.PlanJudgement
          ? data.PlanJudgement.toString()
          : "";
        let supCusApprove = data.SupCusApprove
          ? data.SupCusApprove.toString()
          : "";
        let sendemail = data.SendEmail;
        //NOTE - run check status
        $("#selectConcernDept").val("").trigger("change");
        checkStatus(
          planJudgement,
          data.IssueBy,
          data.CheckBy,
          data.ApproveBy,
          data.StatusSignDeptECN
        );

        DataTableConcernDept(data.SignDeptECN).then(() => {
          a.forEach((items) => {
            isProgramChange = true;
            arraySignDeptECN.push(items.DepartmentID);
            $("#selectConcernDept").val(arraySignDeptECN).trigger("change");
            isProgramChange = false;
          });
        });
        defaultDeptECN = data.SignDeptECN;
        UpdateSignConcernDept(data.SignDeptECN);

        let IssueTime = data.IssueSignTime
          ? formatDateName(data.IssueSignTime)
          : "";
        let CheckTime = data.CheckSignTime
          ? formatDateName(data.CheckSignTime)
          : "";
        let ApproveTime = data.ApproveSignTime
          ? formatDateName(data.ApproveSignTime)
          : "";
        $("#showECNIssue").val(`${data.IssueBy} ${IssueTime}`);
        $("#showEnPeChecked").val(`${data.CheckBy} ${CheckTime}`);
        $("#showEnPeApproved").val(`${data.ApproveBy} ${ApproveTime}`);
        $("#selectReqEmailApproval")
          .val(JSON.parse(sendemail))
          .trigger("change");

        let radioPlanJudgement = document.querySelectorAll(
          'input[name="PlanJudgement"]'
        );
        if (planJudgement) {
          radioPlanJudgement.forEach((radio) => {
            if (radio.value === planJudgement) {
              radio.checked = true;
            }
          });
        } else {
          radioPlanJudgement.forEach((radio) => {
            radio.checked = false;
          });
        }
        valplanJudgement = planJudgement;

        let radioSupCusApprove = document.querySelectorAll(
          'input[name="radioApproval"]'
        );
        if (supCusApprove) {
          radioSupCusApprove.forEach((radio) => {
            if (radio.value === supCusApprove) {
              radio.checked = true;
            }
          });
        } else {
          radioSupCusApprove.forEach((radio) => {
            radio.checked = false;
          });
        }

        viewPDF(data.ApproveFilePath ? data.ApproveFilePath : "");

        let filePath = data.ApproveFilePath || "";
        let fileName = filePath.split("/").pop();

        $("#btnFilePDF").text(fileName ? fileName : "SELECT FILE");
      }
      isProgramChange = false;
    },
  });
}
//NOTE reselectRows
function reselectRows(table, selectedRows) {
  table
    .rows()
    .nodes()
    .to$()
    .each(function (index) {
      if (selectedRows.includes(index)) {
        $(this).addClass("selected");
      }
    });
}
//NOTE viewPDF
function viewPDF(url) {
  if (url) {
    // $(`#btnViewPDF`).prop("disabled", false);
    $(document).on("click", "#btnViewPDF", function () {
      Swal.fire({
        title: "",
        html: `<div id="pdfContainer" style="height: 100%; overflow: hidden; padding-top: 25px;">
                  <object id="pdfViewer" data="${url}" type="application/pdf" style="width: 100%; height: 100%;"></object>
              </div>`,
        width: "70%",
        heightAuto: true,
        showCloseButton: true,
        showConfirmButton: false,
        padding: "10px",
        didOpen: () => {
          const container = document.querySelector(".swal2-popup");
          if (container) {
            container.style.maxHeight = "calc(100vh - 40px)";
          }
          const pdfContainer = document.getElementById("pdfContainer");
          if (pdfContainer) {
            pdfContainer.style.height = "calc(100vh - 80px)";
            pdfContainer.style.margin = "0";
          }

          const closeButton = document.querySelector(".swal2-close");
          if (closeButton) {
            closeButton.style.border = "none";
            closeButton.style.backgroundColor = "transparent";
            closeButton.style.boxShadow = "none";
          }
        },
      });
    });
  }
}
//NOTE dataTalbleConcernDept
function DataTableConcernDept(data) {
  $("#tbConcern_approve tbody").html("");
  return new Promise((resolve) => {
    setTimeout(() => {
      let userName = getCookie("UserID");
      let tbodyHtml = "";
      let DepartmentID = getCookie("DepartmentID");
      let select = tableReqECN.rows(".selected").data()[0];
      let disabled = select
        ? DepartmentID == 3 || DepartmentID == 19
          ? select.ECNStatus == 4 || select.ECNStatus == 3 || select.Active == 0 
            ? "disabled"
            : ""
          : "disabled"
        : "";
      if (data.length != 0) {
        let signIndexData = data?.length
          ? data?.length
          : data?.DepartmentID?.length;

        for (let signIndex = 0; signIndex < signIndexData; signIndex++) {
          let departmentID = Array.isArray(data)
            ? data[signIndex]?.DepartmentID
            : data?.DepartmentID[signIndex];
          let departmentName = Array.isArray(data)
            ? data[signIndex]?.DepartmentName
            : data?.DepartmentName[signIndex];
          let getInputVal_Sign = data[signIndex]?.Value || []; // Get the Value array
          let id = `inputConcern_${departmentID}`;
          let value_input =
            getInputVal_Sign.length > 0
              ? getInputVal_Sign
                  .map(
                    (item) =>
                      `${item.Name} ${formatDateName(item.DateSignTime)}`
                  )
                  .join(" , ")
              : "";

          if (DepartmentID == 3 || DepartmentID == 19) {
            disabled = "disabled";
          } else {
            disabled =
              select.ECNStatus == 3 ||
              select.ECNStatus == 4 ||
              select.Active == 0
                ? "disabled"
                : "";
          }
          tbodyHtml += `<tr>
                                <td>${departmentName}</td> 
                                <td>
                                  <div class="form-group row">
                                    <div class="col-sm-12 input-group">
                                      <input
                                        type="text"
                                        class="form-control text-center ${disabled}"
                                        id="${id}"
                                        placeholder=""
                                        autocomplete="off"
                                        value="${value_input}"
                                        readonly
                                      />
                                      <div class="input-group-btn">
                                        <button class="btn btn-default black btn-swal-sign"
                                        ${disabled} 
                                        type="button" data-title="${departmentName}" 
                                        data-select="selectConcernDept"  
                                        data-target="showConcern_${departmentID}" 
                                        id="btnSignConcernDept_${departmentID}" 
                                        data-id="${departmentID}" 
                                        data-toggle="tooltip" 
                                        data-input="${id}" 
                                        checkSign="/approval/sign/dept" >sign</button>                                </div>
                                    </div>
                                  </div>
                                </td>
             
                                </tr>`;
        }
      } else {
        tbodyHtml = `<tr>
                            <td colspan="2" class="text-center">No Dept ECN</td>
                        </tr>`;
      }

      $("#tbConcern_approve tbody").html(tbodyHtml);
      $(".btn-swal-sign").unbind();
      $(".btn-swal-sign").on("click", function () {
        checkAuth(userDepartmentID);
        let id = $(this).attr("id");
        let checkSign = $(this).attr("checkSign");

        //* รับ ค่าจาก table
        let getItemShow = tableReqECN.rows(".selected").data()[0];
        let getItem = getItemShow ? getItemShow : "";
        let selectedRowsShow = tableReqECN
          .rows(".selected")
          .indexes()
          .toArray(); // เก็บ index ของแถวที่เลือก
        //* ส่งเข้า script function
        swalalertSign(id, getItem, checkSign, selectedRowsShow);
      });
      resolve();
    }, 200);
  });
}
//NOTE updateSignConcernDept
function UpdateSignConcernDept(data) {
  $(document).on("change", "#selectConcernDept", function () {
    if (!isProgramChange) {
      let selectedValues = $(this).val() || [];
      selectedValues.forEach((value) => {
        let inputID = `inputConcern_${value}`;
        let getItem = data.find((item) => item.DepartmentID == value) || {};
        let getInputVal_Sign = getItem.Value || [];
        let value_input =
          getInputVal_Sign.length > 0
            ? getInputVal_Sign
                .map(
                  (item) => `${item.Name} ${formatDateName(item.DateSignTime)}`
                )
                .join(" , ")
            : "";
        $(`#${inputID}`).val(value_input);
      });
    }
  });
}
//NOTE dataTableCheckPoint
function DataTableCheckPoint(data = []) {
  return new Promise((resolve) => {
    let disabled = buttonEvent == "view" ? "disabled" : "";
    setTimeout(() => {
      let tbodyHtml = "";
      if (data.length != 0) {
        data.forEach((item) => {
          tbodyHtml += `<tr>
                              <td>${item.DepartmentName}</td> 
                                <td>
                                  <div class="form-group row">
                                    <div class="col-sm-12 input-group">
                                      <input
                                        type="text"
                                        class="form-control text-center dis_input"
                                        id="${item.DepartmentID}"
                                        value="${item.value}"
                                        ${disabled}
                                        />
                                    </div>
                                  </td>
               
                                  </tr>`;
        });
      } else {
        tbodyHtml = `<tr>
                            <td colspan="2" class="text-center">No data available in table</td>
                        </tr>`;
      }
      $("#tbCheckPoint tbody").html(tbodyHtml);
      resolve(); // ทำงานเสร็จ ให้ resolve
    }, 200);
  });
}
//NOTE dataTableEng
function DataTableEng(data = []) {
  let tbodyHtml = "";
  let disabled = buttonEvent == "view" ? "disabled" : "";
  if (data.length) {
    // สร้างแถวในตารางจากข้อมูล
    data.forEach((item, index) => {
      item.No = index + 1;
      let id = `selectEng_${item.No}`;
      disabled_status = item.Value ? disabled : "disabled";
      tbodyHtml += `<tr>
                      <td>${item.No}</td>
                      <td>${item.Name}</td>
                      <td>
                      <input type="date" data-eng-no="${
                        item.No
                      }" class="form-control val-con-status dis_input" 
                      value="${item.Value}" ${disabled}/>
                      </td>
                      <td>
                        <select class="form-control dis_input" ${disabled_status} id="${id}">
                          <option value="None" ${
                            item.Status == "None" ? "selected" : ""
                          }>None</option>
                          <option value="1" ${
                            item.Status == 1 ? "selected" : ""
                          }>On Process</option>
                          <option value="2" ${
                            item.Status == 2 ? "selected" : ""
                          }>Done</option>
                        </select>
                      </td>
                    </tr>`;
    });
  } else {
    tbodyHtml = `<tr>
                        <td colspan="2" class="text-center">No data available in table</td>
                    </tr>`;
  }
  // ใส่ข้อมูลใหม่ลงในตาราง
  $("#tbEngProcess tbody").html(tbodyHtml);
  $(".val-con-status").change(function () {
    let value = $(this).val();
    let no = $(this).attr("data-eng-no");
    value
      ? $(`#selectEng_${no}`).prop("disabled", false)
      : $(`#selectEng_${no}`).val("None").prop("disabled", true);
  });
}
//NOTE checkStatus
function checkStatus(planJudgement, Issue, Checked, Approved, dept) {
  let selectedRowsShow = tableReqECN.rows(".selected").indexes().toArray();
  if (planJudgement == 1) {
    if (Issue && Checked && Approved && dept == 1) {
      $(".dis_input").prop("disabled", true);
    }
  }
  if (planJudgement == 2) {
    if (Issue && Checked && Approved) {
      $(".dis_input").prop("disabled", true);
    }
  }
}
//NOTE checkAuth
function checkAuth(deptID) {
  if (deptID != defaultEngineeringID) {
    Swal.fire({
      position: "center",
      icon: "warning",
      title: "Warning",
      text: "สำหรับแผนก Engineer เท่านั้น",
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#dc3545",
    });
    return false;
  }
}
//NOTE mailToMap
function mailToMapDatatable() {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let ecnId = urlParams.get("ECNID");

  setTimeout(function () {
    let data = tableReqECN.rows().data().toArray();
    let rowIndex = -1;
    // let found = false;

    data.forEach((item, index) => {
      if (item.ECNID == ecnId) {
        rowIndex = index;
        // found = true
      }
    });
    let rowNode = tableReqECN.row(rowIndex).node();
    $(rowNode).click(); // คลิกที่แถว

    // เลื่อนไปยังแถวที่เลือก
    let tableWrapper = $(".dt-scroll-body");
    let rowPosition = $(rowNode).position().top;

    tableWrapper.animate(
      {
        scrollTop:
          tableWrapper.scrollTop() + rowPosition - tableWrapper.height() / 2,
      },
      100
    ); // ปรับความเร็วของการเลื่อนตามต้องการ

    // $("#btnECNedit").click(); // คลิกปุ่มแก้ไข
    scrollPageTo("headingECNApprov");
  }, 200);
}
//!SECTION

$(document).ready(function () {
  if (userDepartmentID != 3 && userDepartmentID != 19) btn_hide.addClass("d-none");
  let selectedRows = [];
  let engineering = "Engineering Process";
  let valDepartmentID = getCookie("DepartmentID");
  //* อันนี้ในส่วนของการซ่อนปุ่ม/เปิดปุ่ม เมื่อDepartmentID = 3
  if (valDepartmentID == 3 || valDepartmentID == 19) {
    $("#btnECNissue").show();
    $("#btnECNdel").show();
    $("#btnECNedit").show();
  } else {
    $("#btnECNissue").hide();
    $("#btnECNdel").hide();
    $("#btnECNedit").hide();
  }
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  if (urlParams.size > 0) {
    mailToMapDatatable();
  }

  //*========================================= Dropdowm ================================================
  dropdownCustomer("#selectCustomer");
  dropdownProcess();
  dropdownDocumentChange(selectVerifyData);
  dropdownRequestDepartment("#selectSection,#selectConcernDept");
  dropdownEmail("#selectReqEmailIssue,#selectReqEmailApproval");
  // SECTION: Change
  //NOTE Month
  $("#searchMonth").on("change", function () {
    let selectedMonth = $("#searchMonth").val();
    let [year, month] = selectedMonth.split("-");
    tbEcnIssue(month, year);
    $("#headingECNIssue").hide();
    $("#headingECNApprov").hide();
  });
  //NOTE selectCustomer
  $(document).on("change", "#selectCustomer", function () {
    if (!isProgramChange) {
      let CustomerName = $("#selectCustomer").val();
      if (CustomerName !== null) {
        dropdownProject("#selectModel", CustomerName);
        setTimeout(function () {
          let Model = $("#selectModel").val();
          dropdownProjectPart("#selectPartNo", CustomerName, Model);
        }, 200);
      }
    }
  });
  //NOTE Model Request
  $("#selectModel").on("change", function () {
    if (!isProgramChange) {
      let CustomerName = $("#selectCustomer").val();
      let Model = $("#selectModel").val();
      if (CustomerName !== null) {
        dropdownProjectPart("#selectPartNo", CustomerName, Model);
      }
    }
  });
  //NOTE PartCode Request
  $("#selectPartNo").on("change", function () {
    if (!isProgramChange) {
      console.log("Change PartCode"); //! ต้องมีเท่านั้น
      let selectedValue = $(this).val();
      if (valueProjectPart.length > 0) {
        valueProjectPart.forEach((item) => {
          if (selectedValue == item.PartCode) {
            $("#inputPartName_Request").val(item.PartName);
          }
        });
      }
    }
  });
  //NOTE Document Change
  $(document).on("change", "#selectVerifyData", function () {
    if (!isProgramChange) {
      let new_docName = $("#selectVerifyData").val() || [];
      let old_docName = [];
      defaultDoc.forEach((item) => old_docName.push(item["Name"]));
      // add new item to defaultDoc
      let target_add = new_docName.filter(
        (item) => !old_docName.includes(item)
      );
      target_add.forEach((item) => defaultDoc.push({ Name: item, Value: "" }));
      // delete old item from defaultDoc
      let target_delete = old_docName.filter(
        (item) => !new_docName.includes(item)
      );
      target_delete.forEach(
        (item) => (defaultDoc = defaultDoc.filter((doc) => doc["Name"] != item))
      );

      tbDocumentChange(defaultDoc);
    }
  });
  //NOTE CheckPoint
  $(document).on("change", "#selectSection", function () {
    if (!isProgramChange) {
      let departmentArr = $("#selectSection option:selected")
        .map(function () {
          // return $(this).text();
          return {
            DepartmentID: $(this).val(),
            DepartmentName: $(this).text(),
          };
        })
        .get();

      let new_ChcekPoint = $("#selectSection").val() || [];
      let old_ChcekPoint = [];
      defaultCheckPoint.forEach((item) =>
        old_ChcekPoint.push(item["DepartmentID"])
      );
      let target_add = new_ChcekPoint.filter(
        (item) => !old_ChcekPoint.includes(item)
      );
      target_add.forEach((deptId) =>
        defaultCheckPoint.push({
          DepartmentID: deptId,
          DepartmentName: departmentArr.filter(
            (doc) => doc["DepartmentID"] == deptId
          )[0]["DepartmentName"],
          value: "",
        })
      );
      let target_delete = old_ChcekPoint.filter(
        (item) => !new_ChcekPoint.includes(item)
      );
      target_delete.forEach(
        (item) =>
          (defaultCheckPoint = defaultCheckPoint.filter(
            (dept) => dept["DepartmentID"] != item
          ))
      );

      DataTableCheckPoint(defaultCheckPoint);
    }
  });
  //NOTE Concern Dept ECNIssue
  $(document).on("change", "#selectConcernDept", function () {
    if (!isProgramChange) {
      let departmentArr = $("#selectConcernDept option:selected")
        .map(function () {
          return {
            DepartmentID: $(this).val(),
            DepartmentName: $(this).text(),
          };
        })
        .get();
      let new_Condept = $("#selectConcernDept").val() || [];
      let old_Condept = [];
      defaultDeptECN.forEach((item) => old_Condept.push(item["DepartmentID"]));

      let target_add = new_Condept.filter(
        (item) => !old_Condept.includes(item)
      );

      target_add.forEach((deptId) => {
        defaultDeptECN.push({
          DepartmentID: deptId,
          DepartmentName: departmentArr.filter((doc) => doc["DepartmentID"] == deptId)[0]["DepartmentName"],
          Value: deletedDeptValues[deptId] || [],
        });
      });

      let target_delete = old_Condept.filter(
        (item) => !new_Condept.includes(item)
      );

      target_delete.forEach((item) => {
        const dept = defaultDeptECN.find(
          (dept) => dept["DepartmentID"] == item
        );
        if (dept) {
          deletedDeptValues[item] = dept.Value;
        }
        defaultDeptECN = defaultDeptECN.filter(
          (dept) => dept["DepartmentID"] != item
        );
      });

      DataTableConcernDept(defaultDeptECN);
    }
  });
  //!SECTION

  //NOTE Click Table
  tbEcnIssue();
  $("#accordionExample").addClass("d-none");
  $(".displayShow").hide();
  $(document).on("click", "#tableReqECN tbody tr", function () {
    buttonEvent = "view";
    $(".dis_input, .dis_btn, .dis_selectMail, .dis_sendmail").prop(
      "disabled",
      true
    );
    $("#btn_saveECNIssue").hide();
    $("#btn_saveECNApprove").hide();
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnECNedit, #btnECNdel").addClass("d-none");
      $("#inputFilePDF").empty();
      $(".displayShow").hide();
      $(".dis_input, .dis_btn, .dis_selectMail, .dis_sendmail").prop(
        "disabled",
        true
      );
    } else {
      $("#tableReqECN tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnECNedit, #btnECNdel").removeClass("d-none");
      if (userDepartmentID != 3 && userDepartmentID != 19) btn_hide.addClass("d-none");
      $("#inputFilePDF").empty();
      $(".displayShow").hide();

      getECNIssues();
      getECNApprove();
      let data = tableReqECN.rows(".selected").data()[0];
      $("#headingECNIssue").show();
      $("#collapseECNIssue").removeClass("show");
      $("#headingECNApprov").show();
      $("#collapseECNApprov").removeClass("show");

      userDepartmentID == 3 || userDepartmentID == 19
        ? $(".dis_sign, .dis_selectMail, .dis_sendmail").prop("disabled", false)
        : $(".dis_sign, .dis_selectMail, .dis_sendmail").prop("disabled", true);
      if (data.ECNStatus == 1) {
        $("#headingECNIssue #btn_headingECNIssue").click();
        $(".dis_sign").prop("disabled", true);
      } else if (data.ECNStatus != 1) {
        $("#headingECNApprov #btn_headingECNApprove").click();
      }
      if (data.ECNStatus == 3 || data.ECNStatus == 4 || data.Active == 0) {
        $("#btnECNedit, #btnECNdel").prop("disabled", true);
        $("#btn_saveECNApprove").prop("disabled", true);
        $(".dis_sign, .dis_input").prop("disabled", true);
      } else {
        $("#btnECNedit, #btnECNdel").prop("disabled", false);
        $("#btn_saveECNApprove").prop("disabled", false);
      }
      // $(".dis_input, .dis_btn").prop("disabled", true);
    }
  });
  //NOTE: AddIssue
  $("#btnECNissue").unbind();
  $("#btnECNissue").on("click", function () {
    buttonEvent = "add";
    genDefaultEngineerProcess(engineering);
    DocumentChange(selectVerifyData);
    $(".dis_sendmail, .dis_selectMail").prop("disabled", true);
    $(".dis_input").prop("disabled", false);
    $(".dis_btn").prop("disabled", false).show();

    // clearInterval(interval_tableEngProcess);
    $("#headingECNApprov").hide();
    $("#tableReqECN tbody tr").removeClass("selected");
    $("#btnECNedit, #btnECNdel").addClass("d-none");
    $("#accordionExample").removeClass("d-none");
    $("#headingECNIssue").show();
    $("#headingECNIssue #btn_headingECNIssue").click();
    $("#collapseECNIssue").addClass("show");
    $("#collapseECNIssue input").val("");
    $("#collapseECNIssue textarea").val("");
    $("#collapseECNIssue select").val("").trigger("change");
    $("#show_image").attr("src", "/images/p0.jpg");
    $("#selectVerifyData").val([]).trigger("change");
    $("#selectModel").empty();
    $("#selectPartNo").empty();
    $("#inputFile").empty();
    $("#btnFile").empty();
    $("#btnFile").text("SELECT IMAGE");

    //NOTE AddECNIssue
    $("#btn_saveECNIssue").unbind();
    $("#btn_saveECNIssue").on("click", function () {
      console.log("addIssue");
      let data = new FormData();
      let ProcessName = $("#selectProcess").val();
      let ReceivedDate = $("#inputReqDate").val();
      let DrawingRevise = $("#inputDrawRev").val();
      let ECNIssueDate = $("#inputECNDate").val();
      let DrawingNo = $("#inputECNNo").val();
      let InjectionDate = $("#inputInjDate").val();
      let SerialNumber = $("#inputSerialNum").val();
      let CustomerName = $("#selectCustomer").val();
      let PartName = $("#inputPartName_Request").val();
      let PartCode = $("#selectPartNo").val();
      let Model = $("#selectModel").val();
      
        data.append("CustomerName", CustomerName),
        data.append("PartName", PartName),
        data.append("PartCode", PartCode),
        data.append("Model", Model),
        data.append("ProcessName", ProcessName),
        data.append("DrawingRevise", DrawingRevise),
        data.append("ReceivedDate", ReceivedDate),
        data.append("ECNIssueDate", ECNIssueDate),
        data.append("DrawingNo", DrawingNo),
        data.append("CustomerECN", $("#customerECN").val()),
        data.append("InjectionDate", InjectionDate),
        data.append("SerialNumber", SerialNumber),
        data.append("DeliveryPO", $("#inputPO").val()),
        data.append("DeliveryQty", $("#inputQTY").val()),
        data.append("DeliveryDate", $("#inputDate").val()),
        data.append("Remark", $("#inputRemark").val());

      if (window.uploadedFile) {
        data.append("Ischange", 1);
        data.append("ECN_Issue_img", window.uploadedFile);
      }

      let CheckPoint_array = [];
      let tr = $("#tbCheckPoint tbody tr");
      for (let i = 0; i < tr.length; i++) {
        let td = $(tr[i]).children();
        if ($("#selectSection").val() != null) {
          let DepartmentID = $("#selectSection").val()[i];
          let DepartmentName = $(td[0]).text();
          let value = $(td[1]).find("input").val();
          CheckPoint_array.push({ DepartmentID, DepartmentName, value });
        }
      }

      let DocumentChangeArr = [];
      let doc = $("#tableAnsInsPlan tbody tr");
      for (let i = 0; i < doc.length; i++) {
        let td = $(doc[i]).children();
        let NameDoc = $(td[1]).text();
        let value = $(td[2]).find("input").val();
        DocumentChangeArr.push({ Name: NameDoc, Value: value });
      }
      defaultDoc = DocumentChangeArr;

      let CheckpointArr = [];
      CheckPoint_array.forEach((item) => {
        CheckpointArr.push(item);
      });

      let document = [];
      DocumentChangeArr.forEach((item) => {
        document.push(item);
      });

      let EngProcessArr = [];
      let eng = $("#tbEngProcess tbody tr");
      for (let i = 0; i < eng.length; i++) {
        let td = $(eng[i]).children();
        let nameEng = $(td[1]).text();
        let value = $(td[2]).find("input").val();
        let status = $(td[3]).find("select").val();
        EngProcessArr.push({ Name: nameEng, Value: value, Status: status });
      }

      data.append("DocumentChange", JSON.stringify(document));
      data.append("CheckPoint", JSON.stringify(CheckpointArr));
      data.append("EngineeringProcess", JSON.stringify(EngProcessArr));

      $.ajax({
        type: "POST",
        // contentType: "application/json; charset=utf-8",
        processData: false,
        contentType: false,
        url: "/ecn/issue/add",
        data,

        success: function (response) {
          tbEcnIssue();
          Notification();
          window.uploadedFile = null;
          $("#headingECNIssue").hide();
          Swal.fire({
            position: "center",
            icon: "success",
            title: response.message,
            showConfirmButton: false,
            timer: 1500,
          });
        },
        error: function (err) {
          errorText = err.responseJSON.message;

          Swal.fire({
            position: "center",
            icon: "warning",
            title: "Warning",
            text: errorText,
            showConfirmButton: true,
            confirmButtonText: "OK",
            confirmButtonColor: "#dc3545",
          });
        },
      });
    });
  });
  //NOTE EditECN
  $("#btnECNedit").unbind();
  $("#btnECNedit").on("click", function () {
    buttonEvent = "edit";
    $(".dis_btn").prop("disabled", false);
    $(".dis_input").prop("disabled", false);
    $(".dis_sendmail").prop("disabled", false);
    $(".dis_selectMail").prop("disabled", false);
    $("#btn_saveECNIssue").show();
    $("#btn_saveECNApprove").show();
    let selectedRows = tableReqECN.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    $("#collapseECNIssue").removeClass("show");
    $("#collapseECNApprov").removeClass("show");
    $("#headingECNApprov #btn_headingECNApprove").click();

    let selectedData = tableReqECN.rows(".selected").data()[0];

    if (
      selectedData.ECNStatus == 3 ||
      selectedData.ECNStatus == 4 ||
      selectedData.Active == 0
    )
      $(".dis_input").prop("disabled", true);

    //note check date engineer process
    let array_check = $(".val-con-status").toArray();
    array_check.forEach((e) => {
      let value = $(e).val();
      let eng_no = $(e).attr("data-eng-no");
      if (!value) $(`#selectEng_${eng_no}`).val("None").prop("disabled", true);
    });

    //save edit
    $("#btn_saveECNIssue").unbind();
    $("#btn_saveECNIssue").on("click", function () {
      let ECNIssueID = selectedData.ECNIssueID;
      let formData = new FormData();
      formData.append("ECNIssueID", ECNIssueID);
      let data = new FormData();
      let CustomerName = $("#selectCustomer").val();
      let PartName = $("#inputPartName_Request").val();
      let PartCode = $("#selectPartNo").val();
      let Model = $("#selectModel").val();
      
      data.append("CustomerName", CustomerName),
      data.append("PartName", PartName),
      data.append("PartCode", PartCode),
      data.append("Model", Model),
      data.append("ECNIssueID", ECNIssueID);
      data.append("ProcessName", $("#selectProcess").val());
      data.append("DrawingRevise", $("#inputDrawRev").val());
      data.append("ReceivedDate", $("#inputReqDate").val());
      data.append("ECNIssueDate", $("#inputECNDate").val());
      data.append("DrawingNo", $("#inputECNNo").val());
      data.append("CustomerECN", $("#customerECN").val());

      let CheckPoint_array = [];
      let tr = $("#tbCheckPoint tbody tr");
      for (let i = 0; i < tr.length; i++) {
        let td = $(tr[i]).children();
        if ($("#selectSection").val() == null) {
          break;
        }
        let DepartmentID = $("#selectSection").val()[i];
        let DepartmentName = $(td[0]).text();
        let value = $(td[1]).find("input").val();
        CheckPoint_array.push({ DepartmentID, DepartmentName, value });
      }

      let a = [];
      CheckPoint_array.forEach((item) => {
        a.push(item);
      });

      let DocumentChangeArr = [];
      let doc = $("#tableAnsInsPlan tbody tr");
      for (let i = 0; i < doc.length; i++) {
        let td = $(doc[i]).children();
        let NameDoc = $(td[1]).text();
        let value = $(td[2]).find("input").val();
        DocumentChangeArr.push({ Name: NameDoc, Value: value });
      }
      defaultDoc = DocumentChangeArr;

      let document = [];
      DocumentChangeArr.forEach((item) => {
        document.push(item);
      });

      let EngProcessArr = [];
      let eng = $("#tbEngProcess tbody tr");
      for (let i = 0; i < eng.length; i++) {
        let td = $(eng[i]).children();
        let nameEng = $(td[1]).text();
        let value = $(td[2]).find("input").val();
        let status = $(td[3]).find("select").val();
        EngProcessArr.push({ Name: nameEng, Value: value, Status: status });
      }

      let engineering = [];
      EngProcessArr.forEach((item) => {
        engineering.push(item);
      });

      data.append("InjectionDate", $("#inputInjDate").val());
      data.append("SerialNumber", $("#inputSerialNum").val());
      data.append("DeliveryPO", $("#inputPO").val());
      data.append("DeliveryQty", $("#inputQTY").val());
      data.append("DeliveryDate", $("#inputDate").val());
      data.append("DocumentChange", JSON.stringify(document));
      data.append("EngineeringProcess", JSON.stringify(engineering));
      data.append("CheckPoint", JSON.stringify(a));
      data.append("Remark", $("#inputRemark").val());
      if (window.uploadedFile) {
        data.append("Ischange", 1);
        data.append("ECN_Issue_img", window.uploadedFile);
      }

      $.ajax({
        type: "PUT",
        processData: false,
        contentType: false,
        url: "/ecn/issue/edit",
        data,
        success: function (response) {
          tbEcnIssue();

          // ลบการผูก event 'draw.dt' ก่อน เพื่อป้องกันการซ้ำซ้อน
          $("#tableReqECN")
            .off("draw.dt")
            .on("draw.dt", function () {
              reselectRows($("#tableReqECN").DataTable(), selectedRows);
            });

          $("#collapseECNIssue").addClass("");
          Swal.fire({
            position: "center",
            icon: "success",
            title: response.message,
            showConfirmButton: false,
            timer: 1500,
          });
        },
        error: function (err) {
          errorText = err.responseJSON.message;
          Swal.fire({
            position: "center",
            icon: "warning",
            title: "Warning",
            text: errorText,
            showConfirmButton: true,
            confirmButtonText: "OK",
            confirmButtonColor: "#dc3545",
          });
        },
      });
    });
  });
  //NOTE uploadFileIssue
  $("#btnFile").on("click", function () {
    $("#inputFile").click();
  });
  $("#inputFile").on("change", function () {
    window.uploadedFile = null;
    let file = $("#inputFile")[0].files[0];
    if (file) {
      window.uploadedFile = file; // เก็บไฟล์ไว้ในตัวแปร global
      let image = URL.createObjectURL(file);
      $("#show_image").attr("src", image);
      let fileExtension = file.name.split(".").pop().toLowerCase();
      file.name.includes(".jpg");
      if (
        fileExtension !== "jpg" &&
        fileExtension !== "jpeg" &&
        fileExtension !== "png"
      ) {
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "อัพโหลดไฟล์ PNG หรือ JPEG เท่านั้น",
          showConfirmButton: false,
          timer: 1500,
        });
        $("#btnFile").text("SELECT IMAGE");
      } else {
        $("#btnFile").text(file.name ? file.name : "SELECT IMAGE");
      }
    }
  });
  //NOTE Delete
  $("#btnECNdel").unbind();
  $("#btnECNdel").on("click", function () {
    let selectedData = tableReqECN.rows(".selected").data()[0] || null;
    let ECNID = selectedData?.ECNID ? selectedData?.ECNID : selectedData?.ECNID;
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
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          url: "/ecn/issue/delete",
          data: JSON.stringify({
            ECNID,
          }),
          success: function (response) {
            tbEcnIssue();
            $("#btnECNedit, #btnECNdel").addClass("d-none"),
              Swal.fire({
                position: "center",
                icon: "success",
                title: response.message,
                showConfirmButton: false,
                timer: 1500,
              });
          },
          error: function (err) {
            console.log(err);
            errorText = err.responseJSON.message;
            Swal.fire({
              position: "center",
              icon: "warning",
              title: "Warning",
              text: errorText,
              showConfirmButton: true,
              confirmButtonText: "OK",
              confirmButtonColor: "#dc3545",
            });
          },
        });
      }
    });
  });
  //NOTE send email Issue
  $(".sendMail").unbind();
  $(".sendMail").on("click", function () {
    let id = $(this).closest(".input-group").find("select").attr("id");
    let checkRoute = $(this).attr("checkRoute");
    let getSelectShow = tableReqECN.rows(".selected").data()[0];
    let selectrows = tableReqECN.rows(".selected").indexes().toArray();
    sendMail(id, checkRoute, getSelectShow, selectrows);
  });
  //NOTE SaveECN Approve
  $("#btn_saveECNApprove").unbind();
  $("#btn_saveECNApprove").on("click", function () {
    let selectedData = tableReqECN.rows(".selected").data()[0];
    let selectedRows = tableReqECN.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    let ECNApproveID = selectedData.ECNApproveID;
    let SignDeptECN = $("#selectConcernDept").val();
    let radioPlanJudgement =
      $('input[name="PlanJudgement"]:checked').val() || "";
    let radioSupCusApprove =
      $('input[name="radioApproval"]:checked').val() || "";
    let Ischange = window.uploadedFile ? 1 : "";
    let formData = new FormData();
    formData.append("ECNApproveID", ECNApproveID),
      formData.append("SignDeptECN", JSON.stringify(SignDeptECN)),
      formData.append("PlanJudgement", radioPlanJudgement);
    formData.append("SupCusApprove", radioSupCusApprove);
    formData.append("Ischange", Ischange);
    formData.append("ECN_Approval_File", window.uploadedFile);

    $.ajax({
      type: "PUT",
      processData: false,
      contentType: false,
      url: "/ecn/approval/edit",
      data: formData,
      success: function (response) {
        valplanJudgement = radioPlanJudgement;
        tbEcnIssue();
        // ลบการผูก event 'draw.dt' ก่อน เพื่อป้องกันการซ้ำซ้อน
        $("#tableReqECN")
          .off("draw.dt")
          .on("draw.dt", function () {
            reselectRows($("#tableReqECN").DataTable(), selectedRows);
            let selectedData = tableReqECN.rows(".selected").data()[0];
            if (
              selectedData.ECNStatus == 3 ||
              selectedData.ECNStatus == 4 ||
              selectedData.Active == 0
            ) {
              $("#btnECNedit, #btnECNdel").prop("disabled", true);
              $(".dis_sign, .dis_input").prop("disabled", true);
              $("#btn_saveECNApprove").prop("disabled", true);
            } else if (selectedData.ECNStatus == 2) {
              $(".dis_sign").prop("disabled", false);
            }
          });
        $("#collapseECNIssue").addClass("");
        Swal.fire({
          position: "center",
          icon: "success",
          title: response.message,
          showConfirmButton: false,
          timer: 1500,
        });
      },
      error: function (err) {
        console.log(err);
        errorText = err.responseJSON.message;
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "Warning",
          text: errorText,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      },
    });
  });
  //NOTE uploadFileApproval
  $("#btnFilePDF").on("click", function () {
    $("#inputFilePDF").click();
  });
  $("#inputFilePDF").on("change", function () {
    window.uploadedFile = null;
    let file = $("#inputFilePDF")[0].files[0];
    if (file) {
      window.uploadedFile = file;
      let PDF = URL.createObjectURL(file);
      viewPDF(PDF);
      file.name.includes("pdf");
      if (!file.name.includes("pdf")) {
        Swal.fire({
          position: "center",
          icon: "warning",
          title: "อัพโหลดไฟล์PDFเท่านั้น",
          showConfirmButton: false,
          timer: 1500,
        });
        $("#btnFilePDF").text("SELECT FILE");
      } else {
        $("#btnFilePDF").text(file.name ? file.name : "SELECT FILE");
      }
    }
  });
  //NOTE Sign
  $(".btn-swal-sign").unbind();
  $(".btn-swal-sign").on("click", function () {
    checkAuth(userDepartmentID);
    let id = $(this).attr("id");
    let checkSign = $(this).attr("checkSign");
    //* รับ ค่าจาก table
    let getItemShow = tableReqECN.rows(".selected").data()[0];
    let getItem = getItemShow ? getItemShow : "";
    let selectedRowsShow = tableReqECN.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    //* ส่งเข้า script function
    swalalertSign(id, getItem, checkSign, selectedRowsShow);
  });
});
