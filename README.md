 ## To Be Changed 

 - Current Date and Time Slot should minus if reserverd  and show remaining in it ✔️

 - Customer able to View their Order and Inspection http://localhost:3000/orders 
  http://localhost:3000/orders/[id] for details✔️

 - Customer Able to Recevice Invoice Against the Order or Inspections 

 - Vehicle should not be booked a service twice in a day means same Vehicle Cannot booked Twice a day only Once only for eg booked 9-11 then it show not be able book again on same day. (Customer Side)

 - Mechanic can update the progress of vehicle (Awaiting for parts, in progress, completed) For Mechanic Side

 - Inspection only seen as selected 

 - Inspection report layout

 - Order detail unkwown if service is not selected
 
 - Progress cannot be reversable

 - Inspection should be prefined from admin side while creating, also customer have dropdown for inspection while odring can select one ,Multiple and Full inspections which include all of them.


 ```sql 
 UPDATE Users SET imgUrl = '' WHERE imgUrl IS NULL;

 ```
 ```sql
 ALTER TABLE [motomateDb].[dbo].[Users]
ADD [imgurl] VARCHAR(255) NULL; -- or NVARCHAR(255) if you need Unicode support
 ```