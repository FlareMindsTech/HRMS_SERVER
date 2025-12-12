import Menu from '../Modules/MenuModule.js';

//create menu
export const createMenu = async (req,res) =>{
    try {
        const {menuCode} = req.body;

        const exMenu = await Menu.findOne({menuCode: menuCode});
        if(exMenu){
            return res.status(400).json({message: "Menu code already exists"});
        }

        const newMenu = new Menu({
            menuName: req.body.menuName,
            menuCode: req.body.menuCode,
            isActive:req.body.isActive,
            isBlock:req.body.isBlock
        });

        const saveMenu = await newMenu.save();
        res.status(201).json({message: "Menu created successfully", data: saveMenu})
    }catch (error){
        res.status(400).json({message: error.message})
    }
};

//get all menu
export const getAllMenu = async (req,res) => {
    try{
        const menus = await Menu.find();
        res.status(200).json({ data: menus});
    }catch (error){
        res.status(400).json({message: error.message});
    }
};

//get menu by id
export const getMenuId = async (req,res) =>{
    try{
        const menu = await Menu.findById(req.params.id);
        
        if(!menu) return res.status(404).json({message: "Menu not found"});
        res.status(200).json({data: menu});

    }catch (error){
        res.status(404).json({message: error.message});
    }
};

//update menu
export const updateMenu = async (req,res) => {
    try{
        const menu = await Menu.findByIdAndUpdate(req.body.id, {$set: req.body}, {new:true});

        if(!menu) return res.status(404).json({message: "Menu not found"});
        res.status(200).json({message: "Menu updated successfully", data: menu});

    }catch (error){
        res.status(400).json({message: error.message});
    }
};

//delete menu
export const deleteMenu = async (req,res) => {
    try{

        const menu = await Menu.findByIdAndDelete(req.params.id);

        if(!menu) return res.status(404).json({message: "Menu not found"});
        res.status(200).json({message: "Menu deleted succcessfully"});

    }catch (error){
        res.status(404).json({message: error.message});
    }
};