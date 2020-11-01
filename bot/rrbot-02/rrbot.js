// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require("botbuilder");

class RRBOT extends ActivityHandler {
  constructor() {
    super();
    // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
    this.onMessage(async (context, next) => {
      const replyText = `Echo: ${context.activity.text}`;
      await context.sendActivity(MessageFactory.text(replyText, replyText));
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMembersAdded(async (context, next) => {
        await this.sendWelcomeMessage(context)
      // By calling next() you ensure that the next BotHandler is run.
      console.log('after running sendWelcomeMessage')
      await next();
    });
  }
  async sendWelcomeMessage(turnContext) {
    const { activity } = turnContext;
    console.log('Enter Into  sendWelcomeMessage function')
    //iterate over all new members added to the conersation
    for (const idx in activity.membersAdded) {
        console.log('For loop running sendWelcomeMessage')
      if (activity.membersAdded[idx].id !== activity.recipient.id) {
        console.log('if condition  running sendWelcomeMessage')
        var uName = activity.membersAdded[idx].name;
        const welcomeMessage =
        ` Welcome to Restaurant Reservation bot ${ activity.membersAdded[idx].name }.`;
          
        await turnContext.sendActivity(welcomeMessage);
        await this.sendSuggestActions(turnContext);
      }
    }
  }
  async sendSuggestActions(turnContext) {
    var reply = MessageFactory.suggestedActions([
      "Make Reservation",
      "Cancel Reservation",
      "Restaurant Address"],
      "What would you like to do today?",
    );
    await turnContext.sendActivity(reply);
  }
}

module.exports.RRBOT = RRBOT;
