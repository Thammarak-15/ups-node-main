db.createUser(
	{
		user: "firstUser",
		pwd: "firstUserIsTheRootSoThisPasswordShouldBeSomethingZ0phiZtiKated",
		roles: [
			{
				role: "readWrite",
				db: "db_general_purpose_vault"
			}
		]
	}
);