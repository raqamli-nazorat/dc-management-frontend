import { FaArrowLeft } from "react-icons/fa"

const AddCheck = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
                className="w-full h-[600px] flex flex-col max-w-[600px] bg-white dark:bg-[#1A1B1B] rounded-[24px] shadow-2xl overflow-hidden"
            >
                <div className="flex items-center px-6 py-5">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#2c2d2d] rounded-full text-[#1A1D2E] dark:text-white">
                        <FaArrowLeft size={18} />
                    </button>
                    <h2 className="ml-2 text-[17px] font-bold text-[#1A1D2E] dark:text-white">To'lov chekini qo'shing.</h2>
                </div>
            </div>
        </div>
    )
}

export default AddCheck