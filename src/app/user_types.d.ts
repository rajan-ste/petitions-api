type User = {
    /**
     * User id as defined by the database
     */
    id: number,
    /**
     * User email as entered when created
     */
    email: string,
    /**
     * User first name as entered when created
     */
    first_name: string,
    /**
     * User last name as entered when created
     */
    last_name: string,
    /**
     * User profile image
     */
    image_filename: string,
    /**
     * Users hashed password
     */
    password: string,
    /**
     * Users auth token (defaults to NULL)
     */
    auth_token: string
}