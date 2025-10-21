
/**
 * Test case for creating a new lead in the application.
 * Verifies that a lead can be created successfully using the UI.
 * Data-driven using TestNG data provider.
 * @author Auto-generated
 */
package com.leaftaps.testcases;

import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;

import com.framework.testng.api.base.ProjectSpecificMethods;
import com.leaftaps.pages.LoginPage;

public class TC001_CreateLead extends ProjectSpecificMethods {

	/**
	 * Sets the test metadata and data file for the Create Lead test case.
	 */
	@BeforeTest
	public void setValues() {
		testcaseName = "CreateLead";
		testDescription = "Verify that the lead is created";
		authors = "Testleaf";
		category = "Smoke";
		excelFileName = "CreateLead";
	}

	/**
	 * Runs the Create Lead test using data from the data provider.
	 * @param username The username for login
	 * @param password The password for login
	 * @param companyName The company name for the new lead
	 * @param firstName The first name for the new lead
	 * @param lastName The last name for the new lead
	 */
	@Test(dataProvider = "fetchData")
	public void runLogin(String username, String password, String companyName, String firstName, String lastName) {
		new LoginPage()
			.enterUsername(username)
			.enterPassword(password)
			.clickLogin()
			.clickCrmsfaLink()
			.clickLeadsLink()
			.clickCreateLeadLink()
			.enterCompanyName(companyName)
			.enterFirstName(firstName)
			.enterLastName(lastName)
			.selectSource("Conference")
			.clickCreateLeadButton()
			.verifyFirstName(firstName);
	}

}
