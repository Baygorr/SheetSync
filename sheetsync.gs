function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('SheetSync')
    .addItem('Activate SheetSync', 'showSheetSync')
    .addItem('Schedule Meeting','ScheduleMeetings')
    .addToUi();
}

function showSheetSync() {
  var htmlOutput = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('SheetSync')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

function getSpreadsheetTitlesAndColumns() {
  var files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
  var titlesAndColumns = [];
  var index = 0;

  while (files.hasNext()) {
    var file = files.next();
    var ss = SpreadsheetApp.openById(file.getId());
    var sheet = ss.getSheets()[0];
    var columns = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    titlesAndColumns.push({ title: file.getName(), columns: columns });
    index++;
  }

  return titlesAndColumns;
}

function consolidateSelectedData(selectedIndexes, selectedColumns, filename) {
  var files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
  var allData = [];
  var headers = [];
  var fileIndex = 0;
  var selectedFileIndexes = selectedIndexes.map(Number);

  while (files.hasNext()) {
    var file = files.next();
    if (selectedFileIndexes.includes(fileIndex)) {
      var ss = SpreadsheetApp.openById(file.getId());
      var sheet = ss.getSheets()[0];
      var data = sheet.getDataRange().getValues();
      var fileIndexStr = String(fileIndex);

      // Get headers from the first spreadsheet
      if (headers.length === 0) {
        headers = data[0];
      }

      // Determine columns to include
      var columnsToInclude = selectedColumns[fileIndexStr];
      if (!columnsToInclude || columnsToInclude.length === 0) {
        // If no columns selected, include all columns
        columnsToInclude = data[0].map((_, colIndex) => colIndex);
      }

      // Filter data columns based on user selection
      var filteredData = data.map(function(row, rowIndex) {
        // Skip header row from subsequent spreadsheets
        if (rowIndex === 0 && allData.length > 0) return null;
        return columnsToInclude.map(function(colIndex) {
          return row[colIndex];
        });
      }).filter(function(row) {
        return row !== null;
      });

      allData = allData.concat(filteredData);
    }
    fileIndex++;
  }

  var newSpreadsheet = SpreadsheetApp.create(filename);
  var newSheet = newSpreadsheet.getSheets()[0];
  newSheet.getRange(1, 1, allData.length, allData[0].length).setValues(allData);

  return 'Data consolidated successfully!';
}

function scheduleConsolidation(selectedIndexes, selectedColumns, filename, interval) {
  var userProperties = PropertiesService.getUserProperties();
  var workflows = JSON.parse(userProperties.getProperty('workflows') || '[]');

  // Store workflow details in the user properties
  workflows.push({ selectedIndexes, selectedColumns, filename, interval });
  userProperties.setProperty('workflows', JSON.stringify(workflows));

  // Schedule the consolidation based on the interval
  var triggerHandler = function() {
    consolidateSelectedData(selectedIndexes, selectedColumns, filename);
  };

  switch (interval) {
    case 'hourly':
      ScriptApp.newTrigger('triggerHandler')
        .timeBased()
        .everyHours(1)
        .create();
      break;
    case 'daily':
      ScriptApp.newTrigger('triggerHandler')
        .timeBased()
        .everyDays(1)
        .create();
      break;
    case 'weekly':
      ScriptApp.newTrigger('triggerHandler')
        .timeBased()
        .everyWeeks(1)
        .create();
      break;
    case 'monthly':
      ScriptApp.newTrigger('triggerHandler')
        .timeBased()
        .everyMonths(1)
        .create();
      break;
    default:
      throw new Error('Invalid interval');
  }

  return 'Workflow scheduled successfully!';
}

// Function to get all workflows
function getWorkflows() {
  var userProperties = PropertiesService.getUserProperties();
  var workflows = JSON.parse(userProperties.getProperty('workflows') || '[]');
  return workflows;
}

// Function to remove a workflow by index
function removeScheduledWorkflow(index) {
  var userProperties = PropertiesService.getUserProperties();
  var workflows = JSON.parse(userProperties.getProperty('workflows') || '[]');

  // Remove workflow from the array
  if (index > -1 && index < workflows.length) {
    workflows.splice(index, 1);
  }
  userProperties.setProperty('workflows', JSON.stringify(workflows));
  return 'Workflow removed successfully!';
}


// email fucntion 
function sendEmail(subjectt,contentt) {
  var emails = []
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = SpreadsheetApp.getActiveSpreadsheet().getSelection();
  var activeRange = selection.getActiveRangeList(); //gets all te active and selected range in an array 
  var ranges = activeRange.getRanges() //returns a list or range


  for (i in ranges){
    var range =  ranges[i] 
    var rangeValues = range.getValues() //list of cell values in a range 

    for (i in rangeValues){
      var r = rangeValues[i]
      for (i in r ){
        if (r[i] != ""){
          emails.push(r[i])
        }        
      }

    }
  }

    console.log(emails)

    

    for (e in emails){
      var email =  emails[e]
      console.log(email)
      var subject = subjectt
      var content =  contentt
      GmailApp.sendEmail(email,subject,content)
    }
    
}


function ScheduleMeetings() {
  var htmlOutput = HtmlService.createHtmlOutputFromFile('Schedule Meeting')
      .setTitle('Extra Features') .setWidth(500); // Width of the sidebar
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}



