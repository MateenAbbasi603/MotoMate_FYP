 ## To Be Changed 

 - Current Date and Time Slot should minus if reserverd  and show remaining in it ✔️

 - Customer able to View their Order and Inspection http://localhost:3000/orders 
  http://localhost:3000/orders/[id] for details✔️

 - Customer Able to Recevice Invoice Against the Order or Inspections 

 - Vehicle should not be booked a service twice in a day means same Vehicle Cannot booked Twice a day only Once only for eg booked 9-11 then it show not be able book again on same day. (Customer Side)

 - Mechanic can update the progress of vehicle (Awaiting for parts, in progress, completed) For Mechanic Side

 - Inspection only seen as selected ✔️

 - Inspection report layout

 - Order detail unkwown if service is not selected
 
 - Progress cannot be reversable

 - Inspection should be prefined from admin side while creating, also customer have dropdown for inspection while odring can select one✔️
  ,Multiple and Full inspections which include all of them.

 - time slot booked twice while ordering✔️✔️
 


 ```sql 
 UPDATE Users SET imgUrl = '' WHERE imgUrl IS NULL;

 ```
 ```sql
 ALTER TABLE [motomateDb].[dbo].[Users]
ADD [imgurl] VARCHAR(255) NULL; -- or NVARCHAR(255) if you need Unicode support
 ```

 ```sql
ALTER TABLE [dbo].[Inspections]
ADD MechanicId INT;
 ```
 - INVENTORY TO BE DONE TONIGHT ✔️
 - Order table should have ordertype field in the table of orders (Walk in, Online)
 - seperate API for walk in customers
 - Service will be on estimated time
 - admin button for transfer to order ✔️✔️


 ```sql
 ALTER TABLE [motomateDb].[dbo].[Services]
ADD [SubCategory] NVARCHAR(100) NULL;
 ```




 /* Replace these blue colors with primary equivalents: */

/* Gradients */
from-blue-600 to-blue-700 → from-primary to-primary/90
from-blue-700 to-blue-800 → from-primary/90 to-primary
from-blue-100 to-blue-200 → from-primary/10 to-primary/20

/* Background Colors */
bg-blue-600 → bg-primary
bg-blue-700 → bg-primary/90
bg-blue-50 → bg-primary/5

/* Text Colors */
text-blue-600 → text-primary
text-blue-700 → text-primary/90

/* Border and Ring Colors */
focus:border-blue-500 → focus:border-primary
focus:ring-blue-500/20 → focus:ring-primary/20

/* Shadow Colors */
shadow-blue-600/25 → shadow-primary/25
shadow-blue-700/30 → shadow-primary/30

/* Background Clip Text */
bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text → bg-gradient-to-r from-primary to-primary/90 bg-clip-text

/* Hover States */
hover:from-blue-700 hover:to-blue-800 → hover:from-primary/90 hover:to-primary
hover:text-blue-700 → hover:text-primary/90
hover:bg-blue-700 → hover:bg-primary/90

/* Background Decorative Elements */
bg-blue-400/10 → bg-primary/10
from-blue-400/5 to-purple-400/5 → from-primary/5 to-primary/10
from-blue-50/30 → from-primary/5
via-blue-950/30 → via-primary/20