# Error handling

## Error handling in service

1. All our business logic should present in service layer only.
2. If there is some issue during service layer we need to throw an error
3. We need to write a Custom class for handling error

## Error handling in controller

1. Controller should not handle/catch any error

## Error handling plugin / middleware

1. Error handling plugin should catch all errors
2. Error handling plugin should log all errors
3. Send errors in proper format to clients
