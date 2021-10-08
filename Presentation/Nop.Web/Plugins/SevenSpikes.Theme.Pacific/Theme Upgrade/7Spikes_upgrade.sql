-- 7Spikes upgrade scripts from nopCommerce 4.20 to 4.30

-- Upgrade script for Anywhere Sliders
IF(EXISTS (SELECT NULL FROM sys.objects WHERE object_id = OBJECT_ID(N'[SS_AS_SliderImage]') AND type in (N'U')))
BEGIN
	IF( NOT EXISTS (SELECT NULL FROM sys.columns WHERE object_id = object_id(N'[SS_AS_SliderImage]') and NAME='SlideType'))
	BEGIN	
		ALTER TABLE [SS_AS_SliderImage] ADD [SystemName] [nvarchar](max) NOT NULL DEFAULT ('');
		ALTER TABLE [SS_AS_SliderImage] ADD [SlideType] [int] NOT NULL DEFAULT 1;
		ALTER TABLE [SS_AS_SliderImage] ADD [Content] [nvarchar](max) DEFAULT (NULL);
		ALTER TABLE [SS_AS_SliderImage] DROP COLUMN [DisplayText];
		EXEC sp_rename '[SS_AS_SliderImage]', 'SS_AS_Slide';
	END
END

IF(EXISTS (SELECT NULL FROM sys.objects WHERE object_id = OBJECT_ID(N'[SS_AS_AnywhereSlider]') AND type in (N'U')))
BEGIN
	IF( NOT EXISTS (SELECT NULL FROM sys.columns WHERE object_id = object_id(N'[SS_AS_AnywhereSlider]') and NAME='Autoplay'))
	BEGIN
		ALTER TABLE [SS_AS_AnywhereSlider] ADD [Autoplay] [bit] NOT NULL DEFAULT 1;
		ALTER TABLE [SS_AS_AnywhereSlider] ADD [AutoplaySpeed] [int] NOT NULL DEFAULT 3000;
		ALTER TABLE [SS_AS_AnywhereSlider] ADD [Speed] [int] NOT NULL DEFAULT 1000;
		ALTER TABLE [SS_AS_AnywhereSlider] ADD [Fade] [bit] NOT NULL DEFAULT 0;
		ALTER TABLE [SS_AS_AnywhereSlider] ADD [Dots] [bit] NOT NULL DEFAULT 0;
		ALTER TABLE [SS_AS_AnywhereSlider] ADD [Arrows] [bit] NOT NULL DEFAULT 0;
		ALTER TABLE [SS_AS_AnywhereSlider] ADD [MobileBreakpoint] [int] NOT NULL DEFAULT 768;
		ALTER TABLE [SS_AS_AnywhereSlider] ADD [CustomClass] [nvarchar](max) NULL;
		ALTER TABLE [SS_AS_AnywhereSlider] DROP COLUMN [SliderType];
	END
END

-- Upgrade script for One Page Checkout
UPDATE Customer
SET Customer.BillingAddress_Id = NULL, Customer.ShippingAddress_Id = NULL
WHERE (Customer.BillingAddress_Id  IS NOT NULL
AND NOT EXISTS (SELECT 1 
                   FROM CustomerAddresses
                   WHERE Customer.BillingAddress_Id = CustomerAddresses.Address_Id))
OR
(Customer.ShippingAddress_Id  IS NOT NULL
AND NOT EXISTS (SELECT 1 
                   FROM CustomerAddresses
                   WHERE Customer.ShippingAddress_Id = CustomerAddresses.Address_Id))