const { WaterfallDialog, ComponentDialog } = require('botbuilder-dialogs');

const {
  ConfirmPrompt,
  ChoicePrompt,
  DateTimePrompt,
  NumberPrompt,
  TextPrompt,
} = require('botbuilder-dialogs');

//const { DialogSet, DialogTurnStatus } = require("botbuilder-dialogs");
const { DialogSet, Dialog, DialogTurnStatus } = require('botbuilder-dialogs');
const CHOICE_PROMPT = "CHOICE_PROMPT";
const CONFIRM_PROMPT = "CONFIRM_PROMPT";
const TEXT_PROMPT = "TEXT_PROMPT";
const NUMBER_PROMPT = "NUMBER_PROMPT";
const DATETIME_PROMPT = "DATETIME_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";
var endDialog = '';

class CancelReservationDialog extends ComponentDialog {

  constructor(conversationState, userState) {
    super('makeReservationDialog');

    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
    this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
    this.addDialog(
      new NumberPrompt(NUMBER_PROMPT, this.noOfParticipantsValidator)
    );
    this.addDialog(new DateTimePrompt(DATETIME_PROMPT));

    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.firstStep.bind(this), //Ask confirmation if user wants to make reservations?
        this.confirmStep.bind(this), // show summary of values entered by user and ask confirmation to make reservation
        this.summaryStep.bind(this),
      ])
    );
    this.initialDialogId = WATERFALL_DIALOG;
  }

  async run(turnContext, accessor) {
      console.log ( " running makereseravationdialog turncontext and accessor")
    const dialogSet = new DialogSet(accessor);
    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    console.log(results.status);
    console.log(DialogTurnStatus.empty)
    console.log(this.id)
    if (results.status === DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }

  async firstStep(step) {
      console.log('%1');
    endDialog = false;
    console.log('%2');
    // Running a prompt here means the next Waterfalls will be run when the users resonse is received.
    return await step.prompt(
      CONFIRM_PROMPT,
      "would you like to make a reservation?",
      ["yes", "no"]
    );
  }

  
  async confirmStep(step) {
    step.values.time = step.result;

    var msg = ` You have entered following values : \n Name: ${step.values.name} \n Participants: ${step.values.noOfParticipants} \n Date : ${JSON.stringify(step.values.date)} \n Time : ${JSON.stringify(step.values.time)}`;

    await step.context.sendActivity(msg);

    return await step.prompt(
      CONFIRM_PROMPT,
      "Are you sure that all values are correct and you want to make the reservations ?",
      ["yes", "no"]
    );
  }

  async summaryStep(step) {
    if (step.result === true) {
      await step.context.sendActivity(
        "Reservation successfuly made. Your reservation id is : 12345678"
      );
      //endDialog = true;
      //console.log('before endDialog'+endDialog);
      //console.log(step);
      endDialog = true;
      return await step.endDialog();
    }
  }
   

  async isDialogComplete() {
    return endDialog;
  }
}
module.exports.cancelReservationDialog = cancelReservationDialog;
