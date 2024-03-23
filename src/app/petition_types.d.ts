type Petition = {
    id: number,
    title: string,
    description: string,
    creation_date: string,
    image_filename: string,
    owner_id: number,
    category_id: number
}

type getAllPetition = {
    id: number,
    title: string,
    category_id: number,
    owner_id: number,
    first_name: string,
    last_name: string,
    number_supporters: number,
    creation_date: string,
    support_cost: number
}

type getOnePetition = {
    id: number,
    title: string,
    category_id: number,
    owner_id: number,
    first_name: string,
    last_name: string,
    number_supporters: number,
    creation_date: string,
    description: string,
    money_raised: number,
}

type supportTier = {
    title: string,
    description: string,
    cost: number,
    id: number
}

type category = {
    categoryId: number,
    name: string
}