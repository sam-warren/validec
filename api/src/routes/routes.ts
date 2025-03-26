/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ValidationController } from './../controllers/validationController';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "Card": {
        "dataType": "refObject",
        "properties": {
            "quantity": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "set": {"dataType":"string"},
            "collectorNumber": {"dataType":"string"},
            "isFoil": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidationError": {
        "dataType": "refObject",
        "properties": {
            "cardName": {"dataType":"string","required":true},
            "errorType": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["NOT_FOUND"]},{"dataType":"enum","enums":["FORMAT_VIOLATION"]},{"dataType":"enum","enums":["DECK_VIOLATION"]}],"required":true},
            "message": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidationResponse": {
        "dataType": "refObject",
        "properties": {
            "valid": {"dataType":"boolean","required":true},
            "deck": {"dataType":"nestedObjectLiteral","nestedProperties":{"commanders":{"dataType":"array","array":{"dataType":"refObject","ref":"Card"}},"sideboard":{"dataType":"array","array":{"dataType":"refObject","ref":"Card"},"required":true},"mainboard":{"dataType":"array","array":{"dataType":"refObject","ref":"Card"},"required":true}},"required":true},
            "errors": {"dataType":"array","array":{"dataType":"refObject","ref":"ValidationError"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ValidationRequest": {
        "dataType": "refObject",
        "properties": {
            "deckText": {"dataType":"string","required":true},
            "format": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsValidationController_ValidateDecklist: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"ValidationRequest"},
        };
        app.post('/api/validate',
            ...(fetchMiddlewares<RequestHandler>(ValidationController)),
            ...(fetchMiddlewares<RequestHandler>(ValidationController.prototype.ValidateDecklist)),

            async function ValidationController_ValidateDecklist(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsValidationController_ValidateDecklist, request, response });

                const controller = new ValidationController();

              await templateService.apiHandler({
                methodName: 'ValidateDecklist',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
