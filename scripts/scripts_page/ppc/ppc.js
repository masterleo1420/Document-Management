let valPlanJudgement = 0;
let isProgramChange = false;
let isCheckEffective = null
let isCheckDisabled = false
let isCheckCustomerConfirmation = 2
//*---------------------------------------- Table PPC Request List ----------------------------------------
// Get Table
function GetTablePPCRequestList(CusConfirm, selectedMonth , selectedYear ) {
   return $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    data: JSON.stringify({ CusConfirm, RequestMonth: selectedMonth, RequestYear: selectedYear }),
    url: "/ppc/getppc",
    success: function (response) {
      FillTablePPCRequestList_Show(response);
      FillTablePPCRequestList_NotShow(response);
      
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

// Fill Show
function FillTablePPCRequestList_Show(data) {
  tableReqPPC = $("#tableReqPPC").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    // ordering: false,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "40vh",
    data: data,
    columns: [
      {
        data: "No",
      },
      {

        render: function (data, type, row, meta) {
          let Status = row.PPCStatus;
          if (row.Active === true) {
          if (Status == 1 || !Status) {
            return `<span class="label grey-700 w-75">Request</span>`;
          } else if (Status == 2) {
            return `<span class="label warn w-75">En Reply</span>`;
          } else if (Status == 3) {
            return `<span class="label text-white blue-300 w-75">Wait Approve</span>`;
          } else if (Status == 4) {
            return `<span class="label blue w-75">Approved</span>`;
          } else if (Status == 5) {
            return `<span class="label green w-75">Complete</span>`;
          } else if (Status == 6) {
            return `<span class="label danger w-75">Reject</span>`;
          } 
        } else {
          return `<span class="label  w-75">Cancel</span>`;
        }
        },
      },
      {
        data: "RefCode",
      },
      {
        data: "CustomerConfirmation",
        render: function (data, type, row, meta) {
          let Status = row.CustomerConfirmation;
         if(Status == 1){
            return `<span class="">Internal</span>`;
         }else if(Status == 2){
          return `<span class="">External</span>`;
         } else {
          return ""
         }
        },
      },
      {
        data: "CustomerName",
      },
      {
        data: "SecRequest",
      },
      {
        data: "RequestBy",
      },
      {
        data: "PlanImprementDate",
        render: function (data, meta, row) {
          let PlanImprementDate = row.PlanImprementDate;
          return PlanImprementDate ? formatDateName(PlanImprementDate) : "";
        },
      },
      {
        data: "PartCode",
      },
      {
        data: "PartName",
      },
      {
        data: "RequestDate",
        render: function (data, meta, row) {
          let RequestDate = row.RequestDate;
          return RequestDate ? formatDateName(RequestDate) : "";
        },
      },
      {
        data: "ReplySignTime",
        render: function (data, meta, row) {
          let ReplySignTime = row.ReplySignTime;
          return ReplySignTime ? formatDateName(ReplySignTime) : "";
        },
      },
      {
        data: "ApprovePlanDate",
        render: function (data, meta, row) {
          let ApprovePlanDate = row.ApprovePlanDate;
          return ApprovePlanDate
            ? formatDateName(ApprovePlanDate)
            : "";
        },
      },
      {
        data: "CompleteDate",
        render: function (data, meta, row) {
          let CompleteDate = row.CompleteDate;
          return CompleteDate
            ? formatDateName(CompleteDate)
            : "";
        },
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

// Fill Not Show
function FillTablePPCRequestList_NotShow(data) {
  tableReqPPC_Customer = $("#tableReqPPC_Customer").DataTable({
    bDestroy: true,
    searching: true,
    paging: false,
    info: false,
    // ordering: false,
    scrollCollapse: true,
    scrollX: true,
    scrollY: "40vh",
    data: data,
    columns: [
      {
        data: "No",
      },
      {

        render: function (data, type, row, meta) {
          let Status = row.PPCStatus;
          if (row.Active === true) {
          if (Status == 1 || !Status) {
            return `<span class="label grey-700 w-75">Request</span>`;
          } else if (Status == 2) {
            return `<span class="label warn w-75">En Reply</span>`;
          } else if (Status == 3) {
            return `<span class="label text-white blue-300 w-75">Wait Approve</span>`;
          } else if (Status == 4) {
            return `<span class="label blue w-75">Approved</span>`;
          } else if (Status == 5) {
            return `<span class="label green w-75">Complete</span>`;
          } else if (Status == 6) {
            return `<span class="label danger w-75">Reject</span>`;
          } 
        } else {
          return `<span class="label  w-75">Cancel</span>`;
        }
        },
      },
      {
        data: "RefCode",
      },
      {
        data: "CustomerName",
      },
      {
        data: "SecRequest",
      },
      {
        data: "RequestBy",
      },
      {
        data: "PlanImprementDate",
        render: function (data, meta, row) {
          let PlanImprementDate = row.PlanImprementDate;
          return PlanImprementDate ? formatDateName(PlanImprementDate) : "";
        },
      },
      {
        data: "PartCode",
      },
      {
        data: "PartName",
      },
      {
        data: "RequestDate",
        render: function (data, meta, row) {
          let RequestDate = row.RequestDate;
          return RequestDate ? formatDateName(RequestDate) : "";
        },
      },
      {
        data: "ReplySignTime",
        render: function (data, meta, row) {
          let ReplySignTime = row.ReplySignTime;
          return ReplySignTime ? formatDateName(ReplySignTime) : "";
        },
      },
      {
        data: "ApprovePlanDate",
        render: function (data, meta, row) {
          let ApprovePlanDate = row.ApprovePlanDate;
          return ApprovePlanDate
            ? formatDateName(ApprovePlanDate)
            : "";
        },
      },
      {
        data: "CompleteDate",
        render: function (data, meta, row) {
          let CompleteDate = row.CompleteDate;
          return CompleteDate
            ? formatDateName(CompleteDate)
            : "";
        },
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

//*---------------------------------------- Request ----------------------------------------
// Get Request
function GetRequest_Req(PPCID) {
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: "/ppc/request",
    data: JSON.stringify({ PPCID }),
    success: function (response) {
      isProgramChange = true;
      if (response.length > 0) {
        let data = response[0];
        let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()
        let selectedData = tableReqPPC.rows(".selected").data()[0];
        let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
        let select = selectedData ? selectedData : selectedData_Customer;
        let effectivePeriods = data.EffectivePeriod
          ? data.EffectivePeriod.split(",")
          : "";
        let valueEffectivePeriods = effectivePeriods[0] || null;

        //* Detail
        $("#selectReqDepartment_Request").val(data.SecRequest || "").trigger("change");

        $("#selectCustomer_Request")
          .val(data.CustomerName || "")
          .trigger("change");

        $("#inputReqDate_Request").val(
          data.RequestDate ? formatDate(data.RequestDate) : ""
        );
        $("#inputSubject_Request").val(data.Subject || "");
        $("#inputPJtrial_Request").val(
          data.ProjectTrialDate ? formatDate(data.ProjectTrialDate) : ""
        );
        $("#inputPtoI_Request").val(
          data.PlanImprementDate ? formatDate(data.PlanImprementDate) : ""
        );

        dropdownProject("#selectModel_Request", data.CustomerName, data.ModelID)
        dropdownProjectPart("#selectPartCode_Request", data.CustomerName, data.ModelID, data.ProjectPartID);

        $("#selectPartCode_Request")
        .val(data.ProjectPartID || "").trigger("change");
         $("#inputPartName").val(data.PartName || "");
        
      
        $("#selectModel_Request")
          .val(data.ModelID || "").trigger("change");


        //* Previous Process || NewProcess
        $("#inputPrevProcess_Request").val(data.PreviousProcess || "");
        $("#inputNewProcess_Request").val(data.NewProcess || "");

        //* Sign Request By
        $("#showReq_Request").val(data.RequestBy ? `${data.RequestBy} ${formatDateName(data.RequestSignTime)}`: ""
        );

        //* Effective Period
        isCheckEffective = valueEffectivePeriods
          if(select.PPCStatus == 5 || select.PPCStatus  == 6){
            $("#inputEffPeriod_Request").prop("disabled", true);
        }else {
          if (!valueEffectivePeriods == "2") {
            $("#inputEffPeriod_Request").prop("disabled", true);
            $("#inputEffPeriod_Request").val("");

          }
        }
        
       

        if (valueEffectivePeriods) {
          let radioButtons = document.querySelectorAll(
            'input[name="EffPeriod"]'
          );
          radioButtons.forEach((radio) => {
            if (radio.value === valueEffectivePeriods) {
              radio.checked = true;
            }
          });
        }

        $("#inputEffPeriod_Request").val(effectivePeriods[1] || "");

  
        //* CheckBox 
        let ChangeItem = JSON.parse(data.ChangeItem)
        fillChangeItem(ChangeItem)
        let ChangeReason = JSON.parse(data.Reason)
        fillReason(ChangeReason)        


        let checkboxesReady = setInterval(() => {
          let changeItemCheckboxes = document.querySelectorAll('.changeItem_checkbox input[type="checkbox"]');
          let ReasonCheckboxes = document.querySelectorAll('.reason_checkbox input[type="checkbox"]');

          
          if (changeItemCheckboxes.length > 0 || ReasonCheckboxes.length > 0) {
              clearInterval(checkboxesReady); // หยุดการทำงานของ interval เมื่อพบ checkbox
      
              let valueChangeItem = ChangeItem.Data.filter(item => item.Check === 1).map(item => item.Value);
              let valueReason = ChangeReason.Data.filter(item => item.Check === 1).map(item => item.Value);

      
          changeItemCheckboxes.forEach((checkbox) => {
              let checkboxValue = checkbox.value; // ค่าของ checkbox
      
              let isChecked = valueChangeItem.includes(checkboxValue);

              checkbox.checked = isChecked;
      
          });
              ReasonCheckboxes.forEach((checkbox) => {
                let checkboxValue = checkbox.value; 
        
                let isChecked = valueReason.includes(checkboxValue);
    
                checkbox.checked = isChecked
            });

              
          }


      }, 100); // ตรวจสอบทุก 100 มิลลิวินาที
      
        //* Send Email
        $("#selectReqEmail_Request")
          .val(data.SendEmail ? JSON.parse(data.SendEmail) : "")
          .trigger("change");
      }
      isProgramChange = false;
    },
    error: function (err) {
      console.log(err);
      let errorText = err.responseJSON.message
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

// Get Change Box
function GetChangeItem(ChangeItem) {
   return $.ajax({
      type: "post",
      url: "/setting/",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: JSON.stringify({
          TopicName: ChangeItem,
      }),
      success: function (res) {
        fillChangeItem(res)
      },
      error: function (error) {
          console.error('เกิดข้อผิดพลาด:', error);
      },
  });
}

function fillChangeItem(res){
  let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()
  let selectedData = tableReqPPC.rows(".selected").data()[0];
  let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
  let select = selectedData ? selectedData : selectedData_Customer;
  let disable = select ? (select.PPCStatus == 5 || select.PPCStatus  == 6) ? 'disabled' : "" : "";
  
  let tbodyHtml = "";
  let data = res[0];
  let dataJson = res.length > 0 ? JSON.parse(data.JsonData) : [] || res ? res : [];
  let changindex = 0;

  if (dataJson && dataJson.Data) {
      changindex = dataJson.Data.length ? dataJson.Data.length : 0;
  }
  
  if (res && res.Data) {
      changindex = res.Data.length ? res.Data.length : changindex;
  }  
  
      for (let index = 0; index < changindex; index++) {
          let name = dataJson.Data[index].Name;
          let check = dataJson.Data[index].Value

          tbodyHtml += `
              <div class="input-group align-items-center m-b-sm">
                  <div class="checkbox w-100 changeItem_checkbox">
                      <label class="md-check m-0">
                          <input type="checkbox" value="${index + 1}" ${disable}/>
                          <i class="green"></i>
                          ${name}
                      </label>
                  </div>
              </div>
          `;
      }
      $("#changeItemBody").html(tbodyHtml);

      let changeItemCheckboxes = document.querySelectorAll('.changeItem_checkbox input[type="checkbox"]');

      if (changeItemCheckboxes.length > 0) {
        changeItemCheckboxes.forEach((checkbox, index) => {
            let checkValue = dataJson.Data[index].Value; // ค่าของ checkbox ("TRUE" หรือ "FALSE")

            let isChecked = checkValue === "TRUE"; // ถ้าเป็น "TRUE" ให้ตั้งเป็น true ถ้าไม่ใช่ให้ตั้งเป็น false

            checkbox.checked = isChecked;
        });
    }
  
    updateCheckbokDisable()
}

function toggleCheckboxDisabled() {
  $('.changeItem_checkbox input[type="checkbox"]').each(function() {
      $(this).prop('disabled', true);
  });
}

function GetReason(Reason) {
  return $.ajax({
     type: "post",
     url: "/setting/",
     contentType: "application/json; charset=utf-8",
     dataType: "json",
     data: JSON.stringify({
         TopicName: Reason,
     }),
     success: function (res) {
      fillReason(res)
        //  let tbodyHtml = "";
        //  if (res.length > 0) {
        //      let data = res[0];
        //      let dataJson = JSON.parse(data.JsonData);

        //      for (let index = 0; index < dataJson.Data.length; index++) {
        //          let name = dataJson.Data[index].Name;
        //          tbodyHtml += `
        //              <div class="input-group align-items-center m-b-sm">
        //                  <div class="checkbox w-100 reason_checkbox">
        //                      <label class="md-check m-0">
        //                          <input type="checkbox" value="${name}" />
        //                          <i class="green"></i>
        //                          ${name}
        //                      </label>
        //                  </div>
        //              </div>
        //          `;
        //      }
        //      $("#ReasonBody").html(tbodyHtml);
        //  } else {
        //      $("#ReasonBody").html('<p>ไม่มีข้อมูลในระบบ</p>');
        //  }
     },
     error: function (error) {
         console.error('เกิดข้อผิดพลาด:', error);
     },
 });
}

function fillReason(res){
  let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()
  let selectedData = tableReqPPC.rows(".selected").data()[0];
  let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
  let select = selectedData ? selectedData : selectedData_Customer;
  let disable = select ? (select.PPCStatus == 5 || select.PPCStatus  == 6) ? 'disabled' : "" : "";
  

  let tbodyHtml = "";
  let data = res[0];
  let dataJson = res.length > 0 ? JSON.parse(data.JsonData) : [] || res ? res : [];
  let changindex = 0;

  if (dataJson && dataJson.Data) {
      changindex = dataJson.Data.length ? dataJson.Data.length : 0;
  }
  
  if (res && res.Data) {
      changindex = res.Data.length ? res.Data.length : changindex;
  }  
  
      for (let index = 0; index < changindex; index++) {
          let name = dataJson.Data[index].Name;

          tbodyHtml += `
              <div class="input-group align-items-center m-b-sm">
                  <div class="checkbox w-100 reason_checkbox">
                      <label class="md-check m-0">
                          <input type="checkbox" value="${index + 1}" ${disable}/>
                          <i class="green"></i>
                          ${name}
                      </label>
                  </div>
              </div>
          `;
      }
      $("#ReasonBody").html(tbodyHtml);

      let ReasonCheckboxes = document.querySelectorAll('.reason_checkbox input[type="checkbox"]');

      if (ReasonCheckboxes.length > 0) {
        ReasonCheckboxes.forEach((checkbox, index) => {
            let checkValue = dataJson.Data[index].Value; // ค่าของ checkbox ("TRUE" หรือ "FALSE")

            let isChecked = checkValue === "TRUE"; // ถ้าเป็น "TRUE" ให้ตั้งเป็น true ถ้าไม่ใช่ให้ตั้งเป็น false

            checkbox.checked = isChecked;
        });
    }

    updateCheckbokDisable()
}


//*---------------------------------------- Engineer Reply ----------------------------------------
// Get Engineer
function GetEngineerReply_Eng(PPCID) {
  //TODO ยังไม่ทำ
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: "/ppc/engreply",
    data: JSON.stringify({ PPCID }),
    success: function (response) {
      if (response.length > 0) {
        let data = response[0];

        
        //*Ref Code
        $("#inputRefNo").val(data.RefCode ? data.RefCode : "");

        //* Check box || Radio

        let RiskPartsEffected  = "Risk Analysis & Parts Characteristics to be effected"
        let Quality = "Quality Document Concern"
        let RankCon = "Rank Confirmation" 

        if(data.RiskAnalysis_PartEffect || data.QualityDocConcern || data.RankConfirmation){
          let itemRiskAnalysisPartEffect = JSON.parse(data.RiskAnalysis_PartEffect)
          let itemQuality = JSON.parse(data.QualityDocConcern)
          let itemRankConfirmation = JSON.parse(data.RankConfirmation)

          fillRiskPartsEffected(itemRiskAnalysisPartEffect)
          fillQuality(itemQuality)
          fillRankConfirmation(itemRankConfirmation)

        let checkboxesReady = setInterval(() => {
        let RiskCheckboxes = document.querySelectorAll('.riskPartsEffected_checkbox input[type="checkbox"]');
        let QualityCheckboxes = document.querySelectorAll('.quality_checkbox input[type="checkbox"]');
        let RadioRankCon = document.querySelectorAll('input[name="RankCon"]');

            if (RiskCheckboxes.length > 0 || QualityCheckboxes.length > 0 || RadioRankCon.length > 0 ) {
                clearInterval(checkboxesReady); // หยุดการทำงานของ interval เมื่อพบ checkbox

                let valueRiskAnalysisPartEffect = itemRiskAnalysisPartEffect.Data.filter(item => item.Check === 1).map(item => item.Value);
                let valueQuality = itemQuality.Data.filter(item => item.Check === 1).map(item => item.Value);
                let valueRadioRankCon = itemRankConfirmation.Data.filter(item => item.Check === 1).map(item => item.Value);
                //* Risk Analysis & Parts Characteristics to be effected
                RiskCheckboxes.forEach(checkbox => {
                    let checkboxValue = checkbox.value; 
                    let isChecked = valueRiskAnalysisPartEffect.includes(checkboxValue);
        
                    checkbox.checked = isChecked 
                });
  
                //* Quality Document Conncern
                QualityCheckboxes.forEach(checkbox => {
                  let checkboxValue = checkbox.value; 
                  let isChecked = valueQuality.includes(checkboxValue);
      
                  checkbox.checked = isChecked
              });

              //* Rank Confirmation
              RadioRankCon.forEach(radio => {
                let radioValue = radio.value; 
                let isChecked = valueRadioRankCon.includes(radioValue);
        
    
                radio.checked = isChecked 
            });

              
            }
        }, 100); // ตรวจสอบทุก 100 มิลลิวินาที
        } else { 
          GetRiskPartsEffected(RiskPartsEffected)
          GetQuality(Quality) 
          GetRankConfirmation(RankCon)  
        }

        //* Customer Confirmation
        let customerConfirmation = data.CustomerConfirmation ? String(data.CustomerConfirmation) : "";
        let radioCustomerCom = document.querySelectorAll('input[name="CustomerCom"]');
        if (customerConfirmation) {
          $(".cleanRadio").prop("disabled", true);
          // Disable radio buttons ที่ไม่ตรงกับค่า customerConfirmation
          radioCustomerCom.forEach((radio) => {
            if (radio.value === customerConfirmation) {
              radio.checked = true;  // เลือก radio button นั้น
            } 
          });
        } else {
          // Disable ทุก radio button หากไม่มีค่า customerConfirmation
          $(".cleanRadio").prop("disabled", false);

          radioCustomerCom.forEach((radio) => {
            radio.checked = false; // ยกเลิกการเลือก
          });
        }

        //* Reply By
        $("#showReply_EngRq").val(
          data.ReplyBy
            ? `${data.ReplyBy} ${formatDateName(data.ReplySignTime)}`
            : ""
        );

        //* Send Email
        $("#selectReplyEmail").val(data.SendEmail ? JSON.parse(data.SendEmail) : "").trigger("change");
      }
    },
  });
}

// Get Change Box
function GetRiskPartsEffected(RiskPartsEffected) {
  return $.ajax({
     type: "post",
     url: "/setting/",
     contentType: "application/json; charset=utf-8",
     dataType: "json",
     data: JSON.stringify({
         TopicName: RiskPartsEffected,
     }),
     success: function (res) {
      fillRiskPartsEffected(res)
        //  let tbodyHtml = "";
        //  if (res.length > 0) {
        //      let data = res[0];
        //      let dataJson = JSON.parse(data.JsonData);

        //      for (let index = 0; index < dataJson.Data.length; index++) {
        //          let name = dataJson.Data[index].Name;
        //          tbodyHtml += `
        //              <div class="input-group align-items-center m-b-sm">
        //                  <div class="checkbox w-100 riskPartsEffected_checkbox">
        //                      <label class="md-check m-0">
        //                          <input type="checkbox" value="${name}" />
        //                          <i class="green"></i>
        //                          ${name}
        //                      </label>
        //                  </div>
        //              </div>
        //          `;
        //      }
        //      $("#RiskAnalysisBody").html(tbodyHtml);
        //  } else {
        //      $("#RiskAnalysisBody").html('<p>ไม่มีข้อมูลในระบบ</p>');
        //  }
     },
     error: function (error) {
         console.error('เกิดข้อผิดพลาด:', error);
     },
 });
}

function fillRiskPartsEffected(res){
  let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()
  let selectedData = tableReqPPC.rows(".selected").data()[0];
  let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
  let select = selectedData ? selectedData : selectedData_Customer;
  let disable = select ? (select.PPCStatus == 5 || select.PPCStatus  == 6) ? 'disabled' : "" : "";
  
  let tbodyHtml = "";
  let data = res[0];
  let dataJson = res.length > 0 ? JSON.parse(data.JsonData) : [] || res ? res : [];
  let changindex = 0;

  if (dataJson && dataJson.Data) {
      changindex = dataJson.Data.length ? dataJson.Data.length : 0;
  }
  
  if (res && res.Data) {
      changindex = res.Data.length ? res.Data.length : changindex;
  }  
  
      for (let index = 0; index < changindex; index++) {
          let name = dataJson.Data[index].Name;

          tbodyHtml += `
              <div class="input-group align-items-center m-b-sm">
                  <div class="checkbox w-100 riskPartsEffected_checkbox">
                      <label class="md-check m-0">
                          <input type="checkbox" value="${index + 1}" ${disable}/>
                          <i class="green"></i>
                          ${name}
                      </label>
                  </div>
              </div>
          `;
      }
      $("#RiskAnalysisBody").html(tbodyHtml);
      let RiskCheckboxes = document.querySelectorAll('.riskPartsEffected_checkbox input[type="checkbox"]');

      if (RiskCheckboxes.length > 0) {
        RiskCheckboxes.forEach((checkbox, index) => {
            let checkValue = dataJson.Data[index].Value; // ค่าของ checkbox ("TRUE" หรือ "FALSE")

            let isChecked = checkValue === "TRUE"; // ถ้าเป็น "TRUE" ให้ตั้งเป็น true ถ้าไม่ใช่ให้ตั้งเป็น false

            checkbox.checked = isChecked;
        });
    }
    updateCheckbokDisable()
}

function GetQuality(Quality) {
  return $.ajax({
     type: "post",
     url: "/setting/",
     contentType: "application/json; charset=utf-8",
     dataType: "json",
     data: JSON.stringify({
         TopicName: Quality,
     }),
     success: function (res) {
      fillQuality(res)
        //  let tbodyHtml = "";
        //  if (res.length > 0) {
        //      let data = res[0];
        //      let dataJson = JSON.parse(data.JsonData);

        //      for (let index = 0; index < dataJson.Data.length; index++) {
        //          let name = dataJson.Data[index].Name;
        //          tbodyHtml += `
        //              <div class="input-group align-items-center m-b-sm">
        //                  <div class="checkbox w-100 quality_checkbox">
        //                      <label class="md-check m-0">
        //                          <input type="checkbox" value="${name}" />
        //                          <i class="green"></i>
        //                          ${name}
        //                      </label>
        //                  </div>
        //              </div>
        //          `;
        //      }
        //      $("#QuaDocConncernBody").html(tbodyHtml);
        //  } else {
        //      $("#QuaDocConncernBody").html('<p>ไม่มีข้อมูลในระบบ</p>');
        //  }
     },
     error: function (error) {
         console.error('เกิดข้อผิดพลาด:', error);
     },
 });
}

function fillQuality(res){
  let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()
  let selectedData = tableReqPPC.rows(".selected").data()[0];
  let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
  let select = selectedData ? selectedData : selectedData_Customer;
  let disable = select ? (select.PPCStatus == 5 || select.PPCStatus  == 6) ? 'disabled' : "" : "";

  let tbodyHtml = "";
  let data = res[0];
  let dataJson = res.length > 0 ? JSON.parse(data.JsonData) : [] || res ? res : [];
  let changindex = 0;

  if (dataJson && dataJson.Data) {
      changindex = dataJson.Data.length ? dataJson.Data.length : 0;
  }
  
  if (res && res.Data) {
      changindex = res.Data.length ? res.Data.length : changindex;
  }  
  
      for (let index = 0; index < changindex; index++) {
          let name = dataJson.Data[index].Name;

          tbodyHtml += `
              <div class="input-group align-items-center m-b-sm">
                  <div class="checkbox w-100 quality_checkbox">
                      <label class="md-check m-0">
                          <input type="checkbox" value="${index + 1}" ${disable}/>
                          <i class="green"></i>
                          ${name}
                      </label>
                  </div>
              </div>
          `;
      }
      $("#QuaDocConncernBody").html(tbodyHtml);
      let QualityCheckboxes = document.querySelectorAll('.quality_checkbox input[type="checkbox"]');

      if (QualityCheckboxes.length > 0) {
        QualityCheckboxes.forEach((checkbox, index) => {
            let checkValue = dataJson.Data[index].Value; // ค่าของ checkbox ("TRUE" หรือ "FALSE")

            let isChecked = checkValue === "TRUE"; // ถ้าเป็น "TRUE" ให้ตั้งเป็น true ถ้าไม่ใช่ให้ตั้งเป็น false

            checkbox.checked = isChecked;
        });
    }
    updateCheckbokDisable()
}

// Get Redio
function GetRankConfirmation(RankCon) {
  return $.ajax({
     type: "post",
     url: "/setting/",
     contentType: "application/json; charset=utf-8",
     dataType: "json",
     data: JSON.stringify({
         TopicName: RankCon,
     }),
     success: function (res) {
      fillRankConfirmation(res)
        //  let tbodyHtml = "";
        //  if (res.length > 0) {
        //      let data = res[0];
        //      let dataJson = JSON.parse(data.JsonData);

        //      for (let index = 0; index < dataJson.Data.length; index++) {
        //          let name = dataJson.Data[index].Name;
        //          tbodyHtml += `
        //                     <div class="input-group align-items-center m-b-sm">
        //                         <div class="radio w-100">
        //                           <label class="md-check m-0">
        //                             <input type="radio" name="RankCon" value="${index + 1}"/>
        //                             <i class="green"></i>
        //                             ${name}
        //                           </label>
        //                         </div>
        //                       </div>
        //          `;
        //      }
        //      $("#RankConfirmBody").html(tbodyHtml);
        //  } else {
        //      $("#RankConfirmBody").html('<p>ไม่มีข้อมูลในระบบ</p>');
        //  }
     },
     error: function (error) {
         console.error('เกิดข้อผิดพลาด:', error);
     },
 });
}

function fillRankConfirmation(res){
  let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()
  let selectedData = tableReqPPC.rows(".selected").data()[0];
  let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
  let select = selectedData ? selectedData : selectedData_Customer;

  let tbodyHtml = "";
  let data = res[0];
  let dataJson = res.length > 0 ? JSON.parse(data.JsonData) : [] || res ? res : [];
  let changindex = 0;

  if (dataJson && dataJson.Data) {
      changindex = dataJson.Data.length ? dataJson.Data.length : 0;
  }
  
  if (res && res.Data) {
      changindex = res.Data.length ? res.Data.length : changindex;
  }  
  
      for (let index = 0; index < changindex; index++) {
          let name = dataJson.Data[index].Name;

          tbodyHtml += `
                            <div class="input-group align-items-center m-b-sm">
                                <div class="radio w-100">
                                  <label class="md-check m-0">
                                    <input type="radio" name="RankCon" value="${index + 1}"/>
                                    <i class="green"></i>
                                    ${name}
                                  </label>
                                </div>
                              </div>
                 `;
             }
             $("#RankConfirmBody").html(tbodyHtml);

             let RadioRankCon = document.querySelectorAll('input[name="RankCon"]');

      if (RadioRankCon.length > 0) {
        RadioRankCon.forEach((checkbox, index) => {
            let checkValue = dataJson.Data[index].Value; // ค่าของ checkbox ("TRUE" หรือ "FALSE")

            let isChecked = checkValue === "TRUE"; // ถ้าเป็น "TRUE" ให้ตั้งเป็น true ถ้าไม่ใช่ให้ตั้งเป็น false

            checkbox.checked = isChecked;
        });
    }
    if(DepartmentID == 3 || DepartmentID == 19){
      if(select.PPCStatus == 5 || select.PPCStatus == 6){
        $('input[name="RankCon"]').prop('disabled', true);
      }else{
        $('input[name="RankCon"]').prop('disabled', false);
      }
    } else {
      $('input[name="RankCon"]').prop('disabled', true);
    }
    updateCheckbokDisable()


}

//*---------------------------------------- Approve Plan ----------------------------------------
// Get Approve Plan
function GetApprovePlan_ApPlan(PPCApproveID) {
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: "/ppc/approveplan",
    data: JSON.stringify({ PPCApproveID }),
    success: function (response) {
      if (response.length > 0) {
        let data = response[0];
        valPlanJudgement = data.PlanJudgement

        
        let planJudgement = data.PlanJudgement
          ? data.PlanJudgement.toString()
          : "";

          //* Answer / Instruction To Plan
        let Answer = "Answer / Instruction to plan"
        let valueTable = JSON.parse(data.AnswerInstructionToPlan)

        if (valueTable) {
          DataTableVerifyData_ApPlan(valueTable);
        } else {
          GetDataTableVerify_ApPlan(Answer)
        }

        //* Engineer / PE Sect
        $("#showEnPeChecked_ApPlan").val(
          data.CheckBy
            ? `${data.CheckBy} ${formatDateName(data.CheckSignTime)}`
            : ""
        );

        $("#showEnPeApproved_ApPlan").val(
          data.ApproveBy
            ? `${data.ApproveBy} ${formatDateName(data.ApproveSignTime)}`
            : ""
        );

        //* Concern Dept
        // DataTableConcernDept_ApPlan(data.ConcernDept);
        // UpdateSignConcernDept_ApPlan(data.ConcernDept);
        if(data.ConcernDept.length > 0){
          DataTableConcernDept_ApPlan(data.ConcernDept);
          UpdateSignConcernDept_ApPlan(data.ConcernDept);
        }else{
                tbodyHtml = `<tr>
                <td colspan="2" class="text-center">No Concern Dept</td>
            </tr>`;
                  $("#tbConcern_approvePlan tbody").html(tbodyHtml);
        }

        //* Comment
        $("#inputComment_ApPlan").val(data.Comment);

        //* Plan Judgement
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

        //* Submit Plan By
        $("#showAppSubmitPlan").val(
          data.SubmitBy
            ? `${data.SubmitBy} ${formatDateName(data.SubmitDate)}`
            : ""
        );

        //* Send Email
        $("#selectPlanEmail").val(data.SendEmail ? JSON.parse(data.SendEmail) : "").trigger("change");
      }
    },
  });
}

//* (--------- Table ---------)
// Table Verify
function GetDataTableVerify_ApPlan(Answer) {
  return $.ajax({
     type: "post",
     url: "/setting/",
     contentType: "application/json; charset=utf-8",
     dataType: "json",
     data: JSON.stringify({
         TopicName: Answer,
     }),
     success: function (res) {
         let tbodyHtml = "";
         if (res.length > 0) {
             let data = res[0];
             let dataJson = JSON.parse(data.JsonData);
            DataTableVerifyData_ApPlan(dataJson.Data)
         }
     },
     error: function (error) {
         console.error('เกิดข้อผิดพลาด:', error);
     },
 });
}

//
function DataTableVerifyData_ApPlan(valueTable) {
  tbVerifyData_ApprovePlan = $("#tbVerifyData_ApprovePlan").DataTable({
    bDestroy: true,
    scrollX: true,
    data: valueTable,
    columns: [
      {

        render: function (data, type, row, meta) {
          return meta.row + 1;
        },
      },
      {
        data: "Name",
      },
      {
        data: function (data, type, row, meta) {
          let selectedData = tableReqPPC.rows(".selected").data()[0];
          let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
          let select = selectedData ? selectedData : selectedData_Customer;   
          let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()       
          let isDisabled = "";
          
            if (select) {
              isDisabled = select.PPCStatus == 5 || select.PPCStatus == 6 ? 'disabled' : "";
            }
           
          return `<input type="text " class="form-control disInput_complete" value="${data.Value || ""}" ${isDisabled }/>`;
          
        },
        
      },
      // {
      //   data: function (data, type, row, meta) {
      //     return `<button class="btn btn-sm btn-danger h-100" type="button" id="btnDelete_approvePlan">
      //                             <span class="fa fa-trash"></span>
      //                           </button>`;
      //   },
      // },
    ],
  });

  // if (valueTable === null) {
  //   if ($.fn.DataTable.isDataTable("#tbVerifyData_ApprovePlan")) {
  //     $("#tbVerifyData_ApprovePlan").DataTable().clear().draw();
  //   }
  //   return;
  // }
  
}

// ConcernDept
function DataTableConcernDept_ApPlan(data) {
  let tbodyHtml = "";
  let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()
  let selectedData = tableReqPPC.rows(".selected").data()[0];
  let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
  let select = selectedData ? selectedData : selectedData_Customer;

  let id_department = Array.isArray(data)
    ? data?.map((item) => item.DepartmentID)
    : [];

  if (Array.isArray(data)) {
    $("#selectConcernDept_approvePlan").val(id_department).trigger("change");
  }
  if (data) {
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
                (item) => `${item.Name} ${formatDateName(item.DateSignTime)}`
              )
              .join(" , ")
          : "";

          let isDisabled = "";

          if (DepartmentID == 3 || DepartmentID == 19) {
              isDisabled = 'disabled';
          } else {
              isDisabled = (select.PPCStatus == 5 || select.PPCStatus == 6) ? 'disabled' : '';
          }
      
      tbodyHtml += `<tr>
                          <td>${departmentName}</td> 
                          <td>
                            <div class="form-group row">
                              <div class="col-sm-12 input-group">
                                <input
                                  type="text"
                                  class="form-control text-center "
                                  id="${id}"
                                  placeholder=""
                                  autocomplete="off"
                                  value="${value_input}"
                                  readonly
                                />
                                <div class="input-group-btn">
                                  <button class="btn btn-default black btn-swal-sign" 
                                  type="button" data-title="${departmentName}" 
                                  data-select="selectConcernDept_approvePlan" 
                                  data-target="showPlanConcernDept_${departmentID}" 
                                  id="btnSignPlanConcernDept_${departmentID}"
                                  data-id="${departmentID}"
                                  data-toggle="tooltip" data-input="${id}"
                                  checkSign="/approveplan/sign/concernDeptApprove" 
                                  ${isDisabled}>sign</button>
                              </div>
                              </div>
                            </div>
                          </td>
                        </tr>`;
    }
  } else {
    tbodyHtml = `<tr>
                      <td colspan="2" class="text-center">No Concern Dept</td>
                  </tr>`;
  }

  $("#tbConcern_approvePlan tbody").html(tbodyHtml);

  $(".btn-swal-sign").unbind();
  $(".btn-swal-sign").on("click", function () {
    let id = $(this).attr("id");
    let checkSign = $(this).attr("checkSign");

    //* รับ ค่าจาก table
    let getItemShow = tableReqPPC.rows(".selected").data()[0];
    let getItemNontShow = tableReqPPC_Customer.rows(".selected").data()[0];
    let getItem = getItemShow ? getItemShow : getItemNontShow;


    //* ส่งเข้า script function
    swalalertSign(id, getItem, checkSign);
  });
}

function UpdateSignConcernDept_ApPlan(data) {
  $(document).on("change", "#selectConcernDept_approvePlan", function () {
    // รับค่าที่เลือกใน select2
    let selectedValues = $(this).val() || [];

    // อัปเดตค่าของแต่ละ input
    selectedValues.forEach((value) => {
      let inputId = `inputConcern_${value}`;
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
      $(`#${inputId}`).val(value_input);
    });
  });
}

//*---------------------------------------- Approve Start New Condition ----------------------------------------
// Get Approve Start New Condition
function GetApproveSTNC_ApStart(PPCStartID) {
  $.ajax({
    type: "POST",
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: "/ppc/approvestart",
    data: JSON.stringify({
      PPCStartID,
    }),
    success: function (response) {
      if (response.length > 0) {
        let data = response[0];

        $("#inputImprement").val(
          data.ImprementProductLotNo ? data.ImprementProductLotNo : ""
        );

        $("#inputEffProd").val(
          data.EffectiveProdDate ? formatDate(data.EffectiveProdDate) : ""
        );     
        

        //* Engineer / PE Sect
        $("#showEnPeChecked_startNew").val(
          data.CheckBy
            ? `${data.CheckBy} ${formatDateName(data.CheckSignTime)}`
            : ""
        );

        $("#showEnPeApproved_startNew").val(
          data.ApproveBy
            ? `${data.ApproveBy} ${formatDateName(data.ApproveSignTime)}`
            : ""
        );

if(data.ConcernDept.length > 0){
  DataTableConcernDept_ApStart(data.ConcernDept);
  UpdateSignConcernDept_ApStart(data.ConcernDept);
}else{
        tbodyHtml = `<tr>
        <td colspan="2" class="text-center">No Concern Dept</td>
    </tr>`;
          $("#tbConcern_approveStart tbody").html(tbodyHtml);
}

        $("#selectStartNewEmail").val(data.SendEmail ? JSON.parse(data.SendEmail) : "").trigger("change");

        viewPDF(
          data.CustomerApproveFilePath ? data.CustomerApproveFilePath : ""
        );

        let filePath = data.CustomerApproveFilePath || ""; // ใช้ค่าเริ่มต้นเป็นสตริงว่างถ้าไม่มีเส้นทางไฟล์
        let fileName = filePath.split("/").pop(); // ดึงชื่อไฟล์
        $("#btnUploadFile_PMCheckFile").text(fileName ? fileName : "SELECT FILE");

        $("#inputComment_ApStart").val(data.Comment ? data.Comment : "");
      }
    },
  });
}

//* (--------- Table ---------)
// ConcernDept
function DataTableConcernDept_ApStart(data) {
  
  let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()

  let tbodyHtml = "";
  let selectedData = tableReqPPC.rows(".selected").data()[0];
    let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
    let select = selectedData ? selectedData : selectedData_Customer;

  let id_department = Array.isArray(data)
    ? data?.map((item) => item.DepartmentID)
    : [];

  if (Array.isArray(data)) {
    $("#selectConcernDept_approveStart").val(id_department).trigger("change");
  }
  
  if (data) {
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
      let id = `inputConcernStart_${departmentID}`;
      let value_input =
        getInputVal_Sign.length > 0
          ? getInputVal_Sign
              .map(
                (item) =>
                  `${item.Name} ${formatDateName(item.DeptSignTimeStart)}`
              )
              .join(" , ")
          : "";

           let isDisabled = ""
          if (DepartmentID == 3 || DepartmentID == 19) {
            isDisabled = 'disabled';
        } else {
            isDisabled = (select.PPCStatus == 5 || select.PPCStatus == 6) ? 'disabled' : '';
        }
      tbodyHtml += `<tr>
                            <td>${departmentName}</td> 
                            <td>
                              <div class="form-group row">
                                <div class="col-sm-12 input-group">
                                  <input
                                    type="text"
                                    class="form-control text-center "
                                    id="${id}"
                                    placeholder=""
                                    autocomplete="off"
                                    value="${value_input}"
                                    readonly
                                  />
                                  <div class="input-group-btn">
                                    <button class="btn btn-default black btn-swal-sign" type="button" data-title="${departmentName}" data-select="selectConcernDept_approveStart"  data-target="showStartConcernDept_${departmentID}" id="btnSignStartConcernDept_${departmentID}" data-id="${departmentID}" data-toggle="tooltip" data-input="${id}" checkSign="/approvestart/sign/concernDeptStart" ${isDisabled}>sign</button>                                </div>
                                </div>
                              </div>
                            </td>
         
                            </tr>`;

    }

  } else {
    tbodyHtml = `<tr>
                        <td colspan="2" class="text-center">No Concern Dept</td>
                    </tr>`;
  }
  

  $("#tbConcern_approveStart tbody").html(tbodyHtml);


  $(".btn-swal-sign").unbind();
  $(".btn-swal-sign").on("click", function () {
    let id = $(this).attr("id");
    let checkSign = $(this).attr("checkSign");

    //* รับ ค่าจาก table
    let getItemShow = tableReqPPC.rows(".selected").data()[0];
    let getItemNontShow = tableReqPPC_Customer.rows(".selected").data()[0];
    let getItem = getItemShow ? getItemShow : getItemNontShow;
    //* ส่งเข้า script function
    swalalertSign(id, getItem, checkSign);
  });
}

function UpdateSignConcernDept_ApStart(data) {
  $(document).on("change", "#selectConcernDept_approveStart", function () {
    // รับค่าที่เลือกใน select2
    let selectedValues = $(this).val() || [];

    // อัปเดตค่าของแต่ละ input
    selectedValues.forEach((value) => {
      let inputId = `inputConcernStart_${value}`;
      let getItem = data.find((item) => item.DepartmentID == value) || {};
      let getInputVal_Sign = getItem.Value || [];
      let value_input =
        getInputVal_Sign.length > 0
          ? getInputVal_Sign
              .map(
                (item) =>
                  `${item.Name} ${formatDateName(item.DeptSignTimeStart)}`
              )
              .join(" , ")
          : "";
      $(`#${inputId}`).val(value_input);
    });
  });
}

//*---------------------------------------- Setting ----------------------------------------
// Set Collapse
function settingCollapse() {
  let selected_show = tableReqPPC.rows(".selected").data()[0] || null;
  let selected_noneShow =tableReqPPC_Customer.rows(".selected").data()[0] || null;

  //* Show
  if (selected_show) {
    if (selected_show?.PPCStatus == 1 || selected_show?.PPCStatus == null) {
      $("#headingReq").show();
      $("#headingEnReply").show();
      $("#headingApprovePlan").hide();
      $("#headingStartNew").hide();

      $("#collapseReq").removeClass("show");
      $("#collapseEnreply").addClass("show");
      $("#collapseApprovePlan").removeClass("show");
      $("#collapseStartNew").removeClass("show");
    } else if (
      selected_show?.PPCStatus == 2 ||
      selected_show?.PPCStatus == 3 ||
      selected_show?.PPCStatus == 6
    ) {
      $("#headingReq").show();
      $("#headingEnReply").show();
      $("#headingApprovePlan").show();
      $("#headingStartNew").hide();

      $("#collapseReq").removeClass("show");
      $("#collapseEnreply").removeClass("show");
      $("#collapseApprovePlan").addClass("show");
      $("#collapseStartNew").removeClass("show");
    } else if (selected_show?.PPCStatus == 4 || selected_show?.PPCStatus == 5) {
      $("#headingReq").show();
      $("#headingEnReply").show();
      $("#headingApprovePlan").show();
      $("#headingStartNew").show();

      $("#collapseReq").removeClass("show");
      $("#collapseEnreply").removeClass("show");
      $("#collapseApprovePlan").removeClass("show");
      $("#collapseStartNew").addClass("show");
    }
  }

  //* None Show
  if (selected_noneShow) {
    if (
      selected_noneShow?.PPCStatus == 1 ||
      selected_noneShow?.PPCStatus == null
    ) {
      $("#headingReq").show();
      $("#headingEnReply").show();
      $("#headingApprovePlan").hide();
      $("#headingStartNew").hide();

      $("#collapseReq").removeClass("show");
      $("#collapseEnreply").addClass("show");
      $("#collapseApprovePlan").removeClass("show");
      $("#collapseStartNew").removeClass("show");
    } else if (
      selected_noneShow?.PPCStatus == 2 ||
      selected_noneShow?.PPCStatus == 3 ||
      selected_noneShow?.PPCStatus == 6
    ) {
      $("#headingReq").show();
      $("#headingEnReply").show();
      $("#headingApprovePlan").show();
      $("#headingStartNew").hide();

      $("#collapseReq").removeClass("show");
      $("#collapseEnreply").removeClass("show");
      $("#collapseApprovePlan").addClass("show");
      $("#collapseStartNew").removeClass("show");
    } else if (
      selected_noneShow?.PPCStatus == 4 ||
      selected_noneShow?.PPCStatus == 5
    ) {
      $("#headingReq").show();
      $("#headingEnReply").show();
      $("#headingApprovePlan").show();
      $("#headingStartNew").show();

      $("#collapseReq").removeClass("show");
      $("#collapseEnreply").removeClass("show");
      $("#collapseApprovePlan").removeClass("show");
      $("#collapseStartNew").addClass("show");
    }
  }

  // รีเฟรช DataTable เมื่อหน้าต่างถูกปรับขนาด

}

function viewPDF(url) {
  if (url) {
    $("#viewPDF").prop("disabled", false);
    $(document).on("click", "#viewPDF", function () {
      Swal.fire({
        title: "",
        html: `<div id="pdfContainer" style="height: 100%; overflow: hidden; padding-top: 25px;">
                  <object id="pdfViewer" data="${url}" type="application/pdf" style="width: 100%; height: 100%;"></object>
              </div>`,
        width: "70%",
        heightAuto: false,
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
  } else {
    $("#viewPDF").prop("disabled", true);
  }
}


function signInputDis() {
  let selectedRowsShow = tableReqPPC.rows(".selected").indexes().toArray();
  let selectedRowsNontShow = tableReqPPC_Customer.rows(".selected").indexes().toArray();

  let selectedValues_approveStart = $("#selectConcernDept_approveStart").val() || [];
  let selectedValues_approvePlan = $("#selectConcernDept_approvePlan").val() || [];
  let showEnPeChecked_startNew = $("#showEnPeChecked_startNew").val();
  let showEnPeApproved_startNew = $("#showEnPeApproved_startNew").val();
  let showEnPeChecked_ApPlan = $("#showEnPeChecked_ApPlan").val();
  let showEnPeApproved_ApPlan = $("#showEnPeApproved_ApPlan").val();

  let complete = true;  
  let approve = true;
  let notAppove = true;

  selectedValues_approveStart.forEach((value) => {
    let inputIdStart = `inputConcernStart_${value}`;
    let inputValueStart = $(`#${inputIdStart}`).val()?.trim();
    
    if (!inputValueStart) {
      complete = false; 
    }
  });

  selectedValues_approvePlan.forEach((value) => {
    let inputIdPlan = `inputConcern_${value}`;
    let inputValuePlan = $(`#${inputIdPlan}`).val()?.trim();
    
    if (!inputValuePlan) {
      complete = false; 
      approve = false;
    }
  });

  if (!showEnPeChecked_ApPlan || !showEnPeApproved_ApPlan) {
    notAppove = false;
    approve = false;
  }

  if (!showEnPeChecked_startNew || !showEnPeApproved_startNew ||
      !showEnPeChecked_ApPlan || !showEnPeApproved_ApPlan) {
    complete = false; 
  }

  if (complete) {
    $('.disInput_complete').prop('disabled', true);
    $(".disSelect_complete").prop("disabled", true);
    $('input[type="checkbox"]').prop('disabled', true);
    $('input[type="radio"]').prop('disabled', true);
    $('textarea').prop('disabled', true);
    $(".disButton_complete").prop("disabled", true);
    $("#btnSendEmail_Request").prop("disabled", false);
    $(".selectEmail").prop("disabled", false);
    $(".disBtn_mail").prop("disabled", false);
    $("#btnPPCedit").prop("disabled", true);
    $("#btnPPCdel").prop("disabled", true);
    

    selectedValues_approveStart.forEach((value) => {
      let btnIdStart = `#btnSignStartConcernDept_${value}`;
      $(btnIdStart).prop("disabled", true);
    });

    selectedValues_approvePlan.forEach((value) => {
      let btnIdPlan = `#btnSignPlanConcernDept_${value}`;
      $(btnIdPlan).prop("disabled", true);
    });

    GetTablePPCRequestList().done(function () {
      if (selectedRowsShow) {
        reselectRows(tableReqPPC, selectedRowsShow);
      }
      if (selectedRowsNontShow) {
        reselectRows(tableReqPPC_Customer, selectedRowsNontShow);
      }
     
    });
    Notification()
  }


  if (valPlanJudgement == 2 && notAppove) {
    $('.disInput_complete').prop('disabled', true);
    $(".disSelect_complete").prop("disabled", true);
    $('input[type="checkbox"]').prop('disabled', true);
    $('input[type="radio"]').prop('disabled', true);
    $('textarea').prop('disabled', true);
    $(".disButton_complete").prop("disabled", true);
    $("#btnSendEmail_Request").prop("disabled", false);
    $(".selectEmail").prop("disabled", false);
    $(".disBtn_mail").prop("disabled", false);


    selectedValues_approvePlan.forEach((value) => {
      let btnIdPlan = `#btnSignPlanConcernDept_${value}`;
      $(btnIdPlan).prop("disabled", true);
    });

    GetTablePPCRequestList();
    $(".displayShow").hide();
    Notification()

    return notAppove;
  }

  if (valPlanJudgement == 1 && approve) {
    GetTablePPCRequestList().done(function () {
      if (selectedRowsShow) {
        reselectRows(tableReqPPC, selectedRowsShow);
      }
      if (selectedRowsNontShow) {
        reselectRows(tableReqPPC_Customer, selectedRowsNontShow);
      }

      $("#collapseStartNew").addClass("show");
      $("#headingStartNew").show();
      $("#collapseApprovePlan").removeClass("show");
    });

    return approve;
  }
 
  // คืนค่าผลการตรวจสอบ complete
  return complete;
}

function mailToMapDataTable() {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  let ppcId = urlParams.get('PPCID');

  setTimeout(function() {
    let data = tableReqPPC.rows().data().toArray();
    let rowIndex = -1;
    // let found = false;
    
    data.forEach((item, index) => {
      if (item.PPCID == ppcId) {
        rowIndex = index;
        // found = true;
      }
    });

    // if (found) {
      
    //   let page = Math.floor(rowIndex / tableReqPPC.page.len()); // หาเลขหน้าที่ต้องไป Math.floor คือ ปัดเศษเลงเป็นจำนวนเต็ม
    //   tableReqPPC.page(page).draw(false); // เลื่อนไปยังหน้าที่ต้องการโดยไม่รีเฟรชตารางใหม่
      
    //   setTimeout(function() {
        
        
    //     $(tableReqPPC.row(rowIndex).node()).click(); // คลิกที่แถว
    //     $("#btnPPCedit").click(); // คลิกปุ่มแก้ไข
    //   }, 100); // หน่วงเวลาเล็กน้อยเพื่อให้หน้าถัดไปโหลดเสร็จก่อนคลิก
    // }
    let rowNode = tableReqPPC.row(rowIndex).node();
    $(rowNode).click(); // คลิกที่แถว

    // เลื่อนไปยังแถวที่เลือก
    let tableWrapper = $('.dt-scroll-body');
    let rowPosition = $(rowNode).position().top;

    tableWrapper.animate({
      scrollTop: tableWrapper.scrollTop() + rowPosition - tableWrapper.height() / 2
    }, 100); // ปรับความเร็วของการเลื่อนตามต้องการ

    // $("#btnPPCedit").click(); // คลิกปุ่มแก้ไข
    scrollPageTo("accordionExample")
  }, 200);
}

function updateCheckbokDisable() {
  let selectedData = tableReqPPC.rows(".selected").data()[0];
  let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
  let select = selectedData ? selectedData : selectedData_Customer;
  let customerConfirmation = select?.CustomerConfirmation
  if(isCheckDisabled){
    if(select){
      if(select.PPCStatus == 5 || select.PPCStatus  == 6){
        $('input[type="checkbox"]').each(function() {
          $(this).prop('disabled', true);
      });
      $('input[name="RankCon"]').each(function() { 
        $(this).prop('disabled', true); // เปิดใช้งาน
    });
      }else{
        $('input[type="checkbox"]').each(function() {
          $(this).prop('disabled', false);
      });
      $('input[name="RankCon"]').each(function() { 
        $(this).prop('disabled', false); // เปิดใช้งาน
    });
    if(customerConfirmation){
    $('input[name="CustomerCom"]').prop('disabled', true);
    }else{
      $('input[name="CustomerCom"]').prop('disabled', false);
    }
    $('.dis_edit').prop('disabled', false);

      }
    }else{
      $('input[type="checkbox"]').each(function() {
        $(this).prop('disabled', false);
    });
    $('input[name="RankCon"]').each(function() { 
      $(this).prop('disabled', false); // เปิดใช้งาน
  });
  // $('input[name="CustomerCom"]').prop('disabled', false);
  // $('.dis_edit').prop('disabled', false);
    }
  

  } else {
    $('input[type="checkbox"]').each(function() {
      $(this).prop('disabled', true);
  });
  $('input[name="RankCon"]').each(function() { 
    $(this).prop('disabled', true); // ปิดใช้งาน
});
$('input[name="CustomerCom"]').prop('disabled', true);
$('.dis_edit').prop('disabled', true);


  }

}

//*(============================ {(-------------- Event --------------)} ==============================)

$(document).ready(function () {
  dropdownCustomer("#selectCustomer_Request");
  dropdownRequestDepartment_name("#selectReqDepartment_Request");
  dropdownEmail(".selectEmail");

  let DepartmentID = getCookie("DepartmentID");  // NotificationPPC()
  if(DepartmentID == 3 || DepartmentID == 19) {
    $("#btnPPCissue").show()
    $("#btnPPCedit").show()
    $("#btnPPCdel").show()
    $(".selectEmail").prop("disabled", false);
    $(".disBtn_mail").prop("disabled", false);
  } else {
    $("#btnPPCissue").hide()
    $("#btnPPCedit").hide()
    $("#btnPPCdel").hide()
    $(".selectEmail").prop("disabled", true);
    $(".disBtn_mail").prop("disabled", true);

  }
  DataTableVerifyData_ApPlan();
  GetTablePPCRequestList();

  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);
  if(urlParams.size > 0){
    mailToMapDataTable()
  }

  $(".displayShow").hide();
    $(window).on("resize", function () {
    tbVerifyData_ApprovePlan.columns.adjust().draw();
  });

  $('#tableReqPPC').on('page.dt', function() {
    $(".displayShow").hide();
    $("#tableReqPPC tbody tr.selected").removeClass("selected");
  });


  //*=========================================== On Click ===========================================
  // Click PPC On Show And Not Show
  $(document).on("click", "#toggle_show_customers", function () {
      // รีเซ็ตการเลือกในตาราง #tableReqPPC_Customer
      $("#tableReqPPC_Customer tbody tr.selected").removeClass("selected");
      $("#tableReqPPC tbody tr.selected").removeClass("selected");
      $("#btnPPCedit, #btnPPCdel").addClass("d-none");
    
    $(".displayShow").hide();
    let msg_title = $(".show-customer").hasClass("d-none")
      ? "Not Show"
      : "Show";
    let Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      width: "200px",
      timer: 1500,
      timerProgressBar: true,
      // didOpen: (toast) => {
      //   toast.onmouseenter = Swal.stopTimer;
      //   toast.onmouseleave = Swal.resumeTimer;
      // }
    });
    Toast.fire({
      title: msg_title,
    })
    $(".show-customer,.not-show-customer").toggleClass("d-none");
    if(msg_title == "Not Show"){
      $(".dis_CusConfirmation").hide()
      GetTablePPCRequestList(true, null, null);
      isCheckCustomerConfirmation = 1
      $("#countPPCissue").addClass("d-none")
      $("#countPPCissueNoneShow").removeClass("d-none")
    } else {
      $(".dis_CusConfirmation").show()
      GetTablePPCRequestList(false, null, null);
      isCheckCustomerConfirmation = 2
      $("#countPPCissue").removeClass("d-none")
      $("#countPPCissueNoneShow").addClass("d-none")
    }
    Notification()

    
  });

  // Select Table PPC Request Show
  $(document).on("click", "#tableReqPPC tbody tr", function () {

isCheckDisabled = false
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnPPCedit, #btnPPCdel").addClass("d-none");
    } else {
      $("#tableReqPPC tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnPPCedit, #btnPPCdel").removeClass("d-none");
    }

    window.uploadedFile = null;
    $("#input_PDFfile_PMCheckFile").val("");
    

    $(".displayShow").hide();

    let checkboxes = document.querySelectorAll(
      '.checkbox input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    let selectedRadio = document.querySelector(
      'input[name="EffPeriod"]:checked'
    );
    if (selectedRadio) {
      selectedRadio.checked = false;
    }
        dropdownRequestDepartment("#selectConcernDept_approvePlan, #selectConcernDept_approveStart");
    settingCollapse();
    let selectedData = tableReqPPC.rows(".selected").data()[0];
    // let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
    let select = selectedData ? selectedData : "";

    let PPCID = select ? select.PPCID : undefined;
    let PPCApproveID = select ? select.PPCApproveID : undefined;
    let PPCStartID = select ? select.PPCStartID : undefined;

    if (
      PPCID !== undefined ||
      PPCApproveID !== undefined ||
      PPCStartID !== undefined
    ) {
      GetRequest_Req(PPCID);
      GetEngineerReply_Eng(PPCID);
      GetApprovePlan_ApPlan(PPCApproveID);
      GetApproveSTNC_ApStart(PPCStartID);
    }

    setTimeout(function() {
      $('.disInput_complete').prop('disabled', true);

    },200)
    // $('.disInput_complete').prop('disabled', true);
    $(".disSelect_complete").prop("disabled", true);
    
    // $('select').prop('disabled', true);
    $('textarea').prop('disabled', true);
    $('input[name="EffPeriod"]').prop('disabled', true);
    $('input[name="CustomerCom"]').prop('disabled', true);
    $('input[name="PlanJudgement"]').prop('disabled', true)
    $("#btnUploadFile_PMCheckFile").prop("disabled", true);
    // $(".disButton_complete").prop("disabled", true);
    $("#btnSendEmail_Request").prop("disabled", false);
    $("#selectReqEmail_Request").prop("disabled", false);
    // $(".selectEmail").prop("disabled", true);
    // $(".disBtn_mail").prop("disabled", true);
    $("#inputRefNo").prop("disabled", true);
    $("#inputEffPeriod_Request").prop("disabled", true);
    $("#btnSave_Request").hide()
    $("#btnSave_Engineer").hide()
    $("#btnSave_approvePlan").hide()
    $("#btnSave_approveStart").hide()

    // let disable = select ? (select.PPCStatus == 5 || select.PPCStatus  == 6) ? 'disabled' : "" : "";
    if(DepartmentID == 3 || DepartmentID == 19) {
    if(select.PPCStatus == 5 || select.PPCStatus == 6 || select.Active === false){
      $(".disButton_complete").prop("disabled", true);
      $("#btnPPCedit").prop("disabled", true);
      $("#btnPPCdel").prop("disabled", true);

    } else {
   
      $(".disButton_complete").prop("disabled", false);
      $("#btnUploadFile_PMCheckFile").prop("disabled", true);
      $("#btnPPCedit").prop("disabled", false);
      $("#btnPPCdel").prop("disabled", false);
      
      }
  } else {
    $(".selectEmail").prop("disabled", true);
    $(".disBtn_mail").prop("disabled", true);
     $(".disButton_complete").prop("disabled", true);
  }
}



);

  // Select Table PPC Request Not Show
  $(document).on("click", "#tableReqPPC_Customer tbody tr", function () {


    isCheckDisabled = false
    if ($(this).hasClass("selected")) {
      $(this).removeClass("selected");
      $("#btnPPCedit, #btnPPCdel").addClass("d-none");
    } else {
      $("#tableReqPPC_Customer tbody").find("tr.selected").removeClass("selected");
      $(this).addClass("selected");
      $("#btnPPCedit, #btnPPCdel").removeClass("d-none");
    }

    window.uploadedFile = null;
    $("#input_PDFfile_PMCheckFile").val("");

    $(".displayShow").hide();

    let checkboxes = document.querySelectorAll(
      '.checkbox input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    let selectedRadio = document.querySelector(
      'input[name="EffPeriod"]:checked'
    );
    if (selectedRadio) {
      selectedRadio.checked = false;
    }
        dropdownRequestDepartment("#selectConcernDept_approvePlan, #selectConcernDept_approveStart");
    settingCollapse();
    // let selectedData = tableReqPPC.rows(".selected").data()[0];
    let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
    let select = selectedData_Customer ? selectedData_Customer : "";

    let PPCID = select ? select.PPCID : undefined;
    let PPCApproveID = select ? select.PPCApproveID : undefined;
    let PPCStartID = select ? select.PPCStartID : undefined;

    if (
      PPCID !== undefined ||
      PPCApproveID !== undefined ||
      PPCStartID !== undefined
    ) {
      GetRequest_Req(PPCID);
      GetEngineerReply_Eng(PPCID);
      GetApprovePlan_ApPlan(PPCApproveID);
      GetApproveSTNC_ApStart(PPCStartID);
    }


    setTimeout(function() {
      $('.disInput_complete').prop('disabled', true);
    },200)
    // $(".disSelect_complete").prop("disabled", true);
    // $('select').prop('disabled', true);
    $('textarea').prop('disabled', true);
    $('input[name="EffPeriod"]').prop('disabled', true);
    $('input[name="CustomerCom"]').prop('disabled', true);
    $('input[name="PlanJudgement"]').prop('disabled', true)
    $("#btnUploadFile_PMCheckFile").prop("disabled", true);
    // $(".disButton_complete").prop("disabled", true);
    // $("#btnSendEmail_Request").prop("disabled", true);
    // $(".selectEmail").prop("disabled", true);
    // $(".disBtn_mail").prop("disabled", true);
    $("#inputRefNo").prop("disabled", true);
    $("#inputEffPeriod_Request").prop("disabled", true);
    $("#btnSave_Request").hide()
    $("#btnSave_Engineer").hide()
    $("#btnSave_approvePlan").hide()
    $("#btnSave_approveStart").hide()

    if(DepartmentID == 3 || DepartmentID == 19) {
      if(select.PPCStatus == 5 || select.PPCStatus == 6 || select.Active === false){
        $(".disButton_complete").prop("disabled", true);
        $("#btnPPCedit").prop("disabled", true);
        $("#btnPPCdel").prop("disabled", true);
      } else {
        $(".disButton_complete").prop("disabled", false);
        $("#btnUploadFile_PMCheckFile").prop("disabled", true);
        $("#btnPPCedit").prop("disabled", false);
        $("#btnPPCdel").prop("disabled", false);
        }
    } else {
      $(".selectEmail").prop("disabled", true);
      $(".disBtn_mail").prop("disabled", true);
       $(".disButton_complete").prop("disabled", true);
    }
  });

  //* (--------- Request ---------)
  // Click Add Request
  $(document).on("click", "#btnPPCissue", function () {
    isCheckDisabled = true

    // dropdownRequestDepartment_name("#selectReqDepartment_Request");
    // GetTablePPCRequestList();
    $("#selectPartCode_Request").empty();
    $("#selectModel_Request").empty();

    // let topicName = "Change Item"
    //* Disable
    $('input').prop('disabled', false);
    $('select').prop('disabled', false);
    $('input[type="checkbox"]').prop('disabled', true);
    $('input[type="radio"]').prop('disabled', false);
    $('textarea').prop('disabled', false);
    // $(".disButton_complete").prop("disabled", false);
    $("#inputPartName_Request").prop("disabled", true);
    $("#inputEffPeriod_Request").prop("disabled", true);
    $("#btnSave_Request").show().prop("disabled", false);
    $("#btnSignReqby").show().prop("disabled", false);

    //* Collaps
    $("#headingReq").show();
    $("#headingEnReply").hide();
    $("#headingApprovePlan").hide();
    $("#headingStartNew").hide();
    $("#collapseReq").addClass("show");
    $(".showEdit").addClass("d-none");
    $("#tableReqPPC tbody tr").removeClass("selected");
    $("#tableReqPPC_Customer tbody tr").removeClass("selected");

     //* Clear
    $(".clean_selectRequest").val("").trigger("change");
    $("#selectReqEmail_Request").val("").prop("disabled", true).trigger("change")
    $("#btnSendEmail_Request").prop("disabled", true);
    $(".clean_dateRequest").val("");
    $(".clean_textareaRequest").val("");
    $(".clean_inputRequest").val("");
    $("#showReq_Request").val("");

    let ChangeItem = "Change Item"
    let Reason = "Reason"
    GetChangeItem(ChangeItem)
    GetReason(Reason)


    let checkBoxes = document.querySelectorAll(
      '.checkbox input[type="checkbox"]'
    );
    checkBoxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    let selectedRadio = document.querySelector(
      'input[name="EffPeriod"]:checked'
    );
    if (selectedRadio) {
      selectedRadio.checked = false;
      $("#inputEffPeriod_Request").prop("disabled", true);
    }

    //*Save
    $("#btnSave_Request").unbind();
    $("#btnSave_Request").on("click", function () {
      let SecRequest = $("#selectReqDepartment_Request").val(); //
      let RequestDate = $("#inputReqDate_Request").val(); //
      let Subject = $("#inputSubject_Request").val(); //
      let ProjectTrialDate = $("#inputPJtrial_Request").val(); //
      let PlanImprementDate = $("#inputPtoI_Request").val(); //
      let CustomerName = $("#selectCustomer_Request").val();
      let Model = $("#selectModel_Request").val();
      let PartCode = $("#selectPartCode_Request").val();
      let PartName = $("#inputPartName_Request").val();

      let PreviousProcess = $("#inputPrevProcess_Request").val(); //
      let NewProcess = $("#inputNewProcess_Request").val(); //
      let RequestBy = getUserID;
      let RequestSignTime = getDate;

      //* Checkbox
      let changeItem_value = document.querySelectorAll(
        '.changeItem_checkbox input[type="checkbox"]'
      );

      let reason_value = document.querySelectorAll(
        '.reason_checkbox input[type="checkbox"]'
      );

      let ChangeItem = []; //

      let Reason = []; //

      changeItem_value.forEach((checkbox) => {
        let label = checkbox.closest('.changeItem_checkbox').querySelector('label').textContent.trim();
        let value = checkbox.value
        
        // สร้าง object สำหรับแต่ละเช็คบ็อกซ์
        let item = {
            Name: label,
            Value: value, // ใส่ค่า value ถ้าเช็คบ็อกซ์ถูกเลือก หรือเป็นค่าว่าง
            Check:  checkbox.checked ? 1 : 0,
        };
    
        // เพิ่ม object ลงใน array
        ChangeItem.push(item);
    });

    let dataChangeItem = {
      Data: ChangeItem
  };

      reason_value.forEach((checkbox) => {
        let label = checkbox.closest('.reason_checkbox').querySelector('label').textContent.trim();
        let value = checkbox.value
        let item = {
          Name: label,
          Value: value, // ใส่ค่า value ถ้าเช็คบ็อกซ์ถูกเลือก หรือเป็นค่าว่าง
          Check:  checkbox.checked ? 1 : 0,
      };
      Reason.push(item);
      });
      let dataReason = {
        Data: Reason
    };

      let jsonChangeItem = JSON.stringify(dataChangeItem);
      let jsonReason = JSON.stringify(dataReason);

      //* Redio
      let Eff_Radio = document.querySelector('input[name="EffPeriod"]:checked');
      let Eff_value = Eff_Radio ? Eff_Radio.value : "";
      let Eff_input = $("#inputEffPeriod_Request").val() || "";
      let EffectivePeriod = []; //

      EffectivePeriod.push(Eff_value, Eff_input);

      $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: "/ppc/request/add",
        data: JSON.stringify({
          Model,
          PartCode,
          PartName,
          CustomerName,
          SecRequest,
          Subject,
          ProjectTrialDate,
          PlanImprementDate,
          RequestDate,
          ChangeItem: jsonChangeItem,
          Reason: jsonReason,
          EffectivePeriod,
          NewProcess,
          PreviousProcess,
          RequestBy,
          RequestSignTime
        }),
        success: function (response) {
          
          $("#headingReq").hide();
          GetTablePPCRequestList();

          Notification()

          // setCookie("name", response.updatedName);  // 7 หมายถึงอายุคุกกี้ 7 วัน
          // setCookie("PositionName", response.updatedPosition);
      
          // // ดึงค่าคุกกี้ใหม่มาใช้หลังจากตั้งค่าแล้ว
          // let DepartmentID = getCookie("name");
          // let userPosition = getCookie("PositionName");
      
          // // อัปเดตค่าใน HTML
          // $("#DepartmentID").text(DepartmentID);
          // $("#userPosition").text(userPosition);

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
  });

  // Click Edit Request
  $(document).on("click", "#btnPPCedit", function () {
    isCheckDisabled = true
    updateCheckbokDisable()
    $(".disButton_complete").show()
    $("#btnSave_Request").show()
    $("#btnSave_Engineer").show()
    $("#btnSave_approvePlan").show()
    $("#btnSave_approveStart").show()
    // dropdownCustomer("#selectCustomer");
    // dropdownRequestDepartment("#selectConcernDept_approveStart");

    $("#selectReqEmail_Request").prop("disabled", false).trigger("change");
    $("#btnSendEmail_Request").prop("disabled", false);

    let selectedRowsShow = tableReqPPC.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    let selectedRowsNontShow = tableReqPPC_Customer.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก

    let selectedData = tableReqPPC.rows(".selected").data()[0];
    let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
    let select = selectedData ? selectedData : selectedData_Customer;

    if(select.PPCStatus == 5 || select.PPCStatus == 6){
      $('.disInput_complete').prop('disabled', true);
      $(".disSelect_complete").prop("disabled", true);
      $('textarea').prop('disabled', true);
      $('input[name="EffPeriod"]').prop('disabled', true);
      // $('input[name="CustomerCom"]').prop('disabled', true);
      $('input[name="PlanJudgement"]').prop('disabled', true)
      $(".disButton_complete").prop("disabled", true);
      $("#btnSendEmail_Request").prop("disabled", false);
      $(".selectEmail").prop("disabled", false);
      $(".disBtn_mail").prop("disabled", false);

    } else {      
      if(isCheckEffective == 2){
        $("#inputEffPeriod_Request").prop("disabled", false);
      }
   
      $('.disInput_complete').prop('disabled', false);
      $(".disSelect_complete").prop("disabled", false);
      $('textarea').prop('disabled', false);
      $('input[name="EffPeriod"]').prop('disabled', false);
      $('input[name="PlanJudgement"]').prop('disabled', false)
      $(".disButton_complete").prop("disabled", false);
      $("#btnSendEmail_Request").prop("disabled", false);
      $(".selectEmail").prop("disabled", false);
      $(".disBtn_mail").prop("disabled", false);
    }

    $("#inputPartName_Request").prop("disabled", true);


  $("#btnSave_Request").unbind()
  $("#btnSave_Request").on("click", function () {
    let PPCReqID = select ? select.PPCReqID : undefined;

    let SecRequest = $("#selectReqDepartment_Request").val(); 
    let RequestDate = $("#inputReqDate_Request").val(); 
    let Subject = $("#inputSubject_Request").val(); 
    let ProjectTrialDate = $("#inputPJtrial_Request").val(); 
    let PlanImprementDate = $("#inputPtoI_Request").val(); 
    let CustomerName = $("#selectCustomer_Request").val();
    let Model = $("#selectModel_Request").val();
    let PartCode = $("#selectPartCode_Request").val();
    let PartName = $("#inputPartName_Request").val();

    let PreviousProcess = $("#inputPrevProcess_Request").val(); 
    let NewProcess = $("#inputNewProcess_Request").val(); 

    let inputSignRequest = $("#showReq_Request").val();
    // let RequestBy = getUserID
    // let RequestSignTime = getDate

    //* Checkbox
    let changeItem_value = document.querySelectorAll(
      '.changeItem_checkbox input[type="checkbox"]'
    );

    let reason_value = document.querySelectorAll(
      '.reason_checkbox input[type="checkbox"]'
    );

    let ChangeItem = []; //

    let Reason = []; //

   
    changeItem_value.forEach((checkbox) => {
      let label = checkbox.closest('.changeItem_checkbox').querySelector('label').textContent.trim();
      let value = checkbox.value
      
      // สร้าง object สำหรับแต่ละเช็คบ็อกซ์
      let item = {
          Name: label,
          Value: value, // ใส่ค่า value ถ้าเช็คบ็อกซ์ถูกเลือก หรือเป็นค่าว่าง
          Check:  checkbox.checked ? 1 : 0,
      };
  
      // เพิ่ม object ลงใน array
      ChangeItem.push(item);
  });

  let dataChangeItem = {
    Data: ChangeItem
};

reason_value.forEach((checkbox) => {
  let label = checkbox.closest('.reason_checkbox').querySelector('label').textContent.trim();
  let value = checkbox.value
  let item = {
    Name: label,
    Value: value, // ใส่ค่า value ถ้าเช็คบ็อกซ์ถูกเลือก หรือเป็นค่าว่าง
    Check:  checkbox.checked ? 1 : 0,
};
Reason.push(item);
});
let dataReason = {
  Data: Reason
};

    let jsonChangeItem = JSON.stringify(dataChangeItem);
    let jsonReason = JSON.stringify(dataReason);

    //* Redio
    let Eff_Radio = document.querySelector('input[name="EffPeriod"]:checked');
    let Eff_value = Eff_Radio ? Eff_Radio.value : "";
    let Eff_input = $("#inputEffPeriod_Request").val() || "";
    let EffectivePeriod = []; //

    EffectivePeriod.push(Eff_value, Eff_input);

    

    $.ajax({
      type: "PUT",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: "/ppc/request/edit",
      data: JSON.stringify({
        PPCReqID,
        RequestDate,
        Subject,
        ProjectTrialDate,
        PlanImprementDate,
        ChangeItem: jsonChangeItem,
        Reason: jsonReason,
        EffectivePeriod,
        NewProcess,
        PreviousProcess,
        SecRequest,
        PartCode,
        PartName,
        CustomerName,
        Model
      }),
      success: function (response) {
        GetTablePPCRequestList().done(function () {


        if (selectedRowsShow) {
            reselectRows(tableReqPPC, selectedRowsShow);
        }

        if (selectedRowsNontShow) {
            reselectRows(tableReqPPC_Customer, selectedRowsNontShow);
        }

        
          $("#collapseEnreply").addClass("show");
          $("#headingEnReply").show();
          $("#collapseReq").removeClass("show");
        });
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
  
  });

  // Click Delete Request
  $(document).on("click", "#btnPPCdel", function () {

    let selected_show = tableReqPPC.rows(".selected").data()[0] || null;
    
    let selected_noneShow = tableReqPPC_Customer.rows(".selected").data()[0] || null;
    let PPCID = selected_show?.PPCID ? selected_show?.PPCID
      : selected_noneShow?.PPCID;

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
            url: "/ppc/request/delete",
            data: JSON.stringify({
              PPCID,
            }),
            success: function (response) {
              GetTablePPCRequestList();
              $("#btnPPCedit, #btnPPCdel").addClass("d-none");
              Notification()
              $(".displayShow").hide();
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

  //* (--------- Engineer Reply ---------)
  // $("#btnSave_Engineer").unbind()
  $(document).on("click","#btnSave_Engineer", function () {
    let selectedData = tableReqPPC.rows(".selected").data()[0];
    let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
    let select = selectedData ? selectedData : selectedData_Customer;

    let msg_title = $(".show-customer").hasClass("d-none")
    
    let PPCReplyID = select ? select.PPCReplyID : undefined;
    
    let selectedRowsShow = tableReqPPC.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    let selectedRowsNontShow = tableReqPPC_Customer.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก

    let inputSignReply = $("#showReply_EngRq").val();

    //* (Checkbox)
    //* Risk Analysis
    let RiskAnalysis_PartEffect = []; //
    let riskPartsEffected_checkbox = document.querySelectorAll(
      '.riskPartsEffected_checkbox input[type="checkbox"]'
    );

    riskPartsEffected_checkbox.forEach((checkbox) => {
      let label = checkbox.closest('.riskPartsEffected_checkbox').querySelector('label').textContent.trim();
      let value = checkbox.value
      // สร้าง object สำหรับแต่ละเช็คบ็อกซ์
      let item = {
          Name: label,
          Value: value, // ใส่ค่า value ถ้าเช็คบ็อกซ์ถูกเลือก หรือเป็นค่าว่าง
          Check: checkbox.checked ? 1 : 0 // ใส่ค่า value ถ้าเช็คบ็อกซ์ถูกเลือก หรือเป็นค่าว่าง
      };
      // เพิ่ม object ลงใน array
      RiskAnalysis_PartEffect.push(item);
  });

  let dataRiskPartsEffected = {
    Data: RiskAnalysis_PartEffect
};

    //* Quality Document
    let QualityDocConcern = []; //
    let quality_checkbox = document.querySelectorAll(
      '.quality_checkbox input[type="checkbox"]'
    );

    quality_checkbox.forEach((checkbox) => {
      let label = checkbox.closest('.quality_checkbox').querySelector('label').textContent.trim();
      let value = checkbox.value
      // สร้าง object สำหรับแต่ละเช็คบ็อกซ์
      let item = {
          Name: label,
          Value: value, 
          Check: checkbox.checked ? 1 : 0 
      };
      // เพิ่ม object ลงใน array
      QualityDocConcern.push(item);
  });

  let dataQuality = {
    Data: QualityDocConcern
};

let rankConRadios = document.querySelectorAll('input[name="RankCon"]');
let RankConfirmation = [];

rankConRadios.forEach((radio) => {
    let radioName = radio.closest('label').textContent.trim();
    let value = radio.value
    let radioValue = radio.checked ? 1 : 0;
    let rankItem = {
        Name: radioName,
        Value: value,
        Check: radioValue
    };
    RankConfirmation.push(rankItem);
});

let dataRankCon = {
    Data: RankConfirmation
};

    // * Customer Confirmation
    let CustomerCom_Radio = document.querySelector(
      'input[name="CustomerCom"]:checked'
    );

    
    let CustomerCom_value = isCheckCustomerConfirmation == 2 ? CustomerCom_Radio ? CustomerCom_Radio?.value : null : 2;
    let CustomerConfirmation = CustomerCom_value; //

    // CustomerConfirmation.push(CustomerCom_value);

    //* ( Redio )
    //* Rank Confirmation

    let jsonQuality= JSON.stringify(dataQuality);
    let jsonRiskPartsEffected= JSON.stringify(dataRiskPartsEffected);
    let jsonRankCon= JSON.stringify(dataRankCon);


    $.ajax({
      type: "PUT",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: "/ppc/engreply/edit",
      data: JSON.stringify({
        PPCReplyID,
        RiskAnalysis_PartEffect: jsonRiskPartsEffected,
        QualityDocConcern: jsonQuality,
        RankConfirmation: jsonRankCon,
        CustomerConfirmation,
      }),
      success: function (response) {
        GetTablePPCRequestList().done(function () {
          
          if (selectedRowsShow) {
            reselectRows(tableReqPPC, selectedRowsShow);
        }

        if (selectedRowsNontShow) {
            reselectRows(tableReqPPC_Customer, selectedRowsNontShow);
            let selectedData = tableReqPPC.rows(".selected").data()[0];
            let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
            let select = selectedData ? selectedData : selectedData_Customer;
          
        }

          $("#collapseApprovePlan").addClass("show");
          $("#headingApprovePlan").show();
          $("#collapseEnreply").removeClass("show");
          $("#inputRefNo").val(response.RefCode)
          $("#inputRefNo").val(response.refcode)
          
        });
        $(".cleanRadio").prop("disabled", true);
        Swal.fire({
          position: "center",
          icon: "success",
          title: response.message,
          showConfirmButton: false,
          timer: 1500,
        });
        setTimeout(function() {
          tbVerifyData_ApprovePlan.columns.adjust().draw();
        }, 100); // Adjust timeout value if needed
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

  //* (--------- Approve Plan ---------)

  // Save Table Verify Data
  $(document).on("click", "#btnSave_approvePlan", function () {
    let selectedData = tableReqPPC.rows(".selected").data()[0];
    let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
    let select = selectedData ? selectedData : selectedData_Customer;
    let PPCApproveID = select ? select.PPCApproveID : null;

    let selectedRowsShow = tableReqPPC.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    let selectedRowsNontShow = tableReqPPC_Customer.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก

    //* Answer Instruction To Plan
    let AnswerInstructionToPlan_value = [];

    if ($("#tbVerifyData_ApprovePlan").DataTable().data().any()) {
      $("#tbodyTbVerifyData_ApprovePlan tr").each(function () {
        var rowData = {};
        var cells = $(this).find("td");

        // ดึงค่าของ <input> ในเซลล์
        rowData.VerifyNO = cells.eq(0).text();
        rowData.Name = cells.eq(1).text();
        rowData.Value = cells.eq(2).find("input").val(); // ดึงค่าจาก <input>

        AnswerInstructionToPlan_value.push(rowData);
      });

    }

    let AnswerInstructionToPlan = JSON.stringify(AnswerInstructionToPlan_value);

    //* Plan Judgement
    let PlanJudgement_Radio = document.querySelector(
      'input[name="PlanJudgement"]:checked'
    );
    let PlanJudgement_value = PlanJudgement_Radio
      ? PlanJudgement_Radio.value
      : null;
    let Comment = $("#inputComment_ApPlan").val();
    let PlanJudgement = PlanJudgement_value;
    let ConcernDept = $("#selectConcernDept_approvePlan").val() || [];
    // PlanJudgement.push(PlanJudgement_value);

   

    $.ajax({
      type: "PUT",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: "/ppc/approveplan/edit",
      data: JSON.stringify({
        PPCApproveID,
        AnswerInstructionToPlan,
        Comment,
        PlanJudgement,
        ConcernDept,
      }),
      success: function (response) {
        let val = PlanJudgement
        let valArrToNum = Number(val);
        valPlanJudgement = valArrToNum
        
        GetTablePPCRequestList().done(function () {
          if (selectedRowsShow) {
            reselectRows(tableReqPPC, selectedRowsShow);
        }

        if (selectedRowsNontShow) {
            reselectRows(tableReqPPC_Customer, selectedRowsNontShow);
        }

        let selectedData = tableReqPPC.rows(".selected").data()[0];
        let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
        let select = selectedData ? selectedData : selectedData_Customer;
     
        });
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

  //* (--------- Approve Start New Condition ---------)
  $(document).on("click", "#btnSave_approveStart", function () {
    let selectedData = tableReqPPC.rows(".selected").data()[0];
    let selectedData_Customer = tableReqPPC_Customer.rows(".selected").data()[0];
    let select = selectedData ? selectedData : selectedData_Customer;
    let PPCStartID = select ? select.PPCStartID : "";
    let pdfFile = window.uploadedFile
    
    let selectedRowsShow = tableReqPPC.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    let selectedRowsNontShow = tableReqPPC_Customer.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก

   

    let ImprementProductLotNo = $("#inputImprement").val();
    let EffectiveProdDate = $("#inputEffProd").val();
    let ConcernDept = $("#selectConcernDept_approveStart").val();
    let Comment = $("#inputComment_ApStart").val();
    let Ischange = pdfFile ? "1" : "2"

    // สร้าง FormData และเพิ่มข้อมูล
    let formData = new FormData();
    formData.append("PPCStartID", PPCStartID);
    formData.append("ImprementProductLotNo", ImprementProductLotNo);
    formData.append("EffectiveProdDate", EffectiveProdDate);
    formData.append("ConcernDept", JSON.stringify(ConcernDept)); // ต้องแปลงเป็น JSON
    formData.append("Comment", Comment);
    formData.append("approve_start", pdfFile); // เพิ่มไฟล์ PDF
    formData.append("Ischange", Ischange);
    
    $.ajax({
      type: "PUT",
      url: "/ppc/approvestart/edit",
      data: formData,
      processData: false, // ต้องเป็น false สำหรับ FormData
      contentType: false, // ต้องเป็น false สำหรับ FormData
      success: function (response) {
        GetTablePPCRequestList().done(function () {
          if (selectedRowsShow) {
            reselectRows(tableReqPPC, selectedRowsShow);
        }

        if (selectedRowsNontShow) {
            reselectRows(tableReqPPC_Customer, selectedRowsNontShow);
        }
        });

        Swal.fire({
          position: "center",
          icon: "success",
          title: response.message,
          showConfirmButton: false,
          timer: 1500,
        });
      },

      error: function (error) {
        // console.error("Error:", error);
        let err = JSON.parse(error.responseText)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message,
          confirmButtonText: "OK",
          confirmButtonColor: "#dc3545",
        });
      },
    });
  });

  //*======================================== On Change =======================================
  //* (--------- Search Month ---------)

  $(document).on("change","#searchMonth", function () {
    // $("#modalPJmanagement").addClass("d-none");
    let selectedMonth = $("#searchMonth").val();
    let [year, month] = selectedMonth.split("-");
    GetTablePPCRequestList(true, month, year);
    $(".displayShow").hide();
  });

  $(document).on("change","#searchMonthNone", function () {
    // $("#modalPJmanagement").addClass("d-none");
    let selectedMonth = $("#searchMonthNone").val();
    let [year, month] = selectedMonth.split("-");
    GetTablePPCRequestList(false, month, year);
    $(".displayShow").hide();
  });
  //* (--------- Request ---------)
  // Change Customer Request
  $(document).on("change", "#selectCustomer_Request", function () {
    if (!isProgramChange) {
    let CustomerName = $("#selectCustomer_Request").val();

    if (CustomerName !== null) {
      dropdownProject("#selectModel_Request", CustomerName);

      setTimeout(function () {
        let Model = $("#selectModel_Request").val();
        dropdownProjectPart("#selectPartCode_Request", CustomerName, Model);
        
      }, 100);

    }
  }
  });

  // Change Model Request
  $(document).on("change", "#selectModel_Request", function () {
    if (!isProgramChange) {

    let CustomerName = $("#selectCustomer_Request").val();
    let Model = $("#selectModel_Request").val();

    if (CustomerName !== null) {
      dropdownProjectPart("#selectPartCode_Request", CustomerName, Model);
    }
  }
  });

  // Change PartCode Request
  $(document).on("change", "#selectPartCode_Request", function () {
    
    if (!isProgramChange) {
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

    // Change EffPeriod Request
    $('input[name="EffPeriod"]').change(function () {
      let checkEffPeriod = $('input[name="EffPeriod"]:checked').val();
  
      if (checkEffPeriod == "2") {
        $("#inputEffPeriod_Request").prop("disabled", false);
      } else {
        $("#inputEffPeriod_Request").prop("disabled", true);
        $("#inputEffPeriod_Request").val("");
      }
    });

  //* (--------- Approve Plan ---------)
  // Change Concern Dept Approve Plan
  $(document).on("change", "#selectConcernDept_approvePlan", function () {
    let selectedOption = $("#selectConcernDept_approvePlan option:selected");
    let DepartmentID = $("#selectConcernDept_approvePlan").val();

    let DepartmentName = selectedOption.map(function () {
        return $(this).text();
      })
      .get();

    let data = DepartmentID
      ? { DepartmentName: DepartmentName, DepartmentID: DepartmentID }
      : "";
    DataTableConcernDept_ApPlan(data);
  });

  //* (--------- Approve Start New Condition ---------)
  // Change Concern Dept Approve Plan
  $(document).on("change", "#selectConcernDept_approveStart", function () {
    let DepartmentID = $("#selectConcernDept_approveStart").val(); // ดึงค่าที่ถูกเลือก (array)
    // ดึงค่า `data-id` ของ option ที่ถูกเลือก
    let DepartmentName = $("#selectConcernDept_approveStart option:selected")
      .map(function () {
        return $(this).text();
      })
      .get();

    let data = DepartmentID
      ? { DepartmentName: DepartmentName, DepartmentID: DepartmentID }
      : "";
    DataTableConcernDept_ApStart(data);
  });

  //*======================================= Sign =======================================
  $(".btn-swal-sign").unbind();
  $(".btn-swal-sign").on("click", function () {
    let id = $(this).attr("id");
    let checkSign = $(this).attr("checkSign");
    //* รับ ค่าจาก table
    let getItemShow = tableReqPPC.rows(".selected").data()[0];
    let getItemNontShow = tableReqPPC_Customer.rows(".selected").data()[0];
    let getItem = getItemShow ? getItemShow : getItemNontShow;
    //* ส่งเข้า script function

    let selectedRowsShow = tableReqPPC.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    let selectedRowsNontShow = tableReqPPC_Customer.rows(".selected").indexes().toArray(); // เก็บ index ของแถวที่เลือก
    let selectedRows = selectedRowsShow ? selectedRowsShow : selectedRowsNontShow
    swalalertSign(id, getItem, checkSign, selectedRows);
  });

  //*======================================= Email =======================================
  $(".sendMail").unbind();
  $(".sendMail").on("click", function () {
    let id = $(this).closest(".input-group").find("select").attr("id");
    let checkRout = $(this).attr("checkRout");

    let getItemShow = tableReqPPC.rows(".selected").data()[0];
    let getItemNontShow = tableReqPPC_Customer.rows(".selected").data()[0];
    let getItem = getItemShow ? getItemShow : getItemNontShow;

    sendMail(id, checkRout, getItem);
  });

  //*======================================= Upload File =======================================
  $(document).on("click", "#btnUploadFile_PMCheckFile", function (e) {
    $("#input_PDFfile_PMCheckFile").click();
  });

  $(document).on("change", "#input_PDFfile_PMCheckFile", function (e) {
    window.uploadedFile = null;
    let file = $("#input_PDFfile_PMCheckFile")[0].files[0];
    if (file && file.type === "application/pdf") {
      window.uploadedFile = file; // เก็บไฟล์ไว้ในตัวแปร global
      let pdfUrl = URL.createObjectURL(window.uploadedFile);
      viewPDF(pdfUrl);

      $("#btnUploadFile_PMCheckFile").text(file.name ? file.name : "SELECT FILE");

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
      $("#input_PDFfile_PMCheckFile").val(""); // Clear input
    }
  });

  //*======================================= Other =======================================
  //* Table Verify Collapse
  $(".collapse").on("shown.bs.collapse hidden.bs.collapse", function () {
    tbVerifyData_ApprovePlan.draw();
  });


});


