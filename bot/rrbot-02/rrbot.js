// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const { MakeReservationDialog } = require('./componentDialogs/makeReservationDialog');
const { CancelReservationDialog } = require('./componentDialogs/cancelReservationDialog')
const {LuisRecognizer, QnAMaker}  = require('botbuilder-ai');



class RRBOT extends ActivityHandler {
    constructor(conversationState,userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState,this.userState);
        this.cancelReservationDialog = new CancelReservationDialog(this.conversationState,this.userState);
   
        
        this.previousIntent = this.conversationState.createProperty("previousIntent");
        this.conversationData = this.conversationState.createProperty('conservationData');
        

        const dispatchRecognizer = new LuisRecognizer({
            applicationId: process.env.LuisAppId,
            endpointKey: process.env.LuisAPIKey,
            endpoint: `https://${ process.env.LuisAPIHostName }.api.cognitive.microsoft.com`
        }, {
            includeAllIntents: true
        }, true);

       
        const qnaMaker = new QnAMaker({
            knowledgeBaseId: process.env.QnAKnowledgebaseId,
            endpointKey: process.env.QnAEndpointKey,
            host: process.env.QnAEndpointHostName
        });
    
   
        
        
        this.qnaMaker = qnaMaker;


        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {

        const luisResult = await dispatchRecognizer.recognize(context)
        const intent = LuisRecognizer.topIntent(luisResult); 
       
        console.log('*** Luis Intent ****');
        console.log(intent);
        const entities = luisResult.entities;
        //await this.previousIntent.set(context,{intentName: intent});
        await this.dispatchToIntentAsync(context,intent,entities);
        
        await next();

        });

    this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });   
    this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context)
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

  

    async sendWelcomeMessage(turnContext) {
        const { activity } = turnContext;

        // Iterate over all new members added to the conversation.
        for (const idx in activity.membersAdded) {
            if (activity.membersAdded[idx].id !== activity.recipient.id) {
                const welcomeMessage = `Welcome to Restaurant Reservation Bot ${ activity.membersAdded[idx].name }. `;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext) {
        var reply = MessageFactory.suggestedActions(['Make Reservation','Cancel Reservation','Restaurant Address'],'What would you like to do today ?');
        await turnContext.sendActivity(reply);
    }


    async dispatchToIntentAsync(context,intent,entities){

        var currentIntent = '';
        const previousIntent = await this.previousIntent.get(context,{});
        const conversationData = await this.conversationData.get(context,{});   

        console.log('**Start of Debug***');
        console.log('**Previous Intent***');
        console.log(previousIntent.intentName);
        console.log('**Current Intent***');
        console.log(intent);
        console.log('**End of Debug***');
        if(previousIntent.intentName && conversationData.endDialog === false )
        {
           currentIntent = previousIntent.intentName;


        }
        else if (previousIntent.intentName && conversationData.endDialog === true)
        {
             currentIntent = intent;
             

        }
        else if(intent === "None" && !previousIntent.intentName  )
        {
             console.log("*** Enter into qnamaker !!!! ")   
            var result = await this.qnaMaker.getAnswers(context);
            console.log(`${ result[0].answer}`);
            await context.sendActivity(`${ result[0].answer}`);
            await context.sendActivity(`test message`);
            await this.sendSuggestedActions(context);
        }
        
        else
        {
            currentIntent = intent;
            await this.previousIntent.set(context,{intentName: intent});
            console.log('**else Start of Debug***');
            console.log('**Previous Intent***');
            console.log(previousIntent.intentName);
            console.log('**else Current Intent***');
            console.log(intent);
            console.log('**else End of Debug***');

        }
    switch(currentIntent)
    {

        case 'Make_Reservation':
        console.log("Inside Make Reservation Case");
        await this.conversationData.set(context,{endDialog: false});
        await this.makeReservationDialog.run(context,this.dialogState,entities);
        conversationData.endDialog = await this.makeReservationDialog.isDialogComplete();
        if(conversationData.endDialog)
        {
            await this.previousIntent.set(context,{intentName: null});
            await this.sendSuggestedActions(context);

        } 
        break;


        case 'Cancel_Reservation':
            console.log("Inside Cancel Reservation Case");
            await this.conversationData.set(context,{endDialog: false});
            await this.cancelReservationDialog.run(context,this.dialogState);
            conversationData.endDialog = await this.cancelReservationDialog.isDialogComplete();
            if(conversationData.endDialog)
            {   
                await this.previousIntent.set(context,{intentName: null});
                await this.sendSuggestedActions(context);
    
            }
            
            break;


        default:
            console.log("Did not match Make Reservation case");
            break;
    }


    }


}



module.exports.RRBOT = RRBOT;
