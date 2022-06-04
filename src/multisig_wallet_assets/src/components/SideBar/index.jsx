import { BsPlus, BsFillLightningFill, BsGearFill } from 'react-icons/bs';
import { SiSolidity, SiJava} from "react-icons/si";
import { FaBattleNet, FaPoo } from 'react-icons/fa';

const SideBar = () => {
  return (
    <div className="fixed top-0 left-0 h-screen w-16 flex flex-col
                  bg-white dark:bg-gray-900 shadow-lg">
        <SideBarIcon icon={<FaBattleNet size="28" />} text="FVT IDE"/>
        <Divider />
        <SideBarIcon icon={<SiSolidity size="32" />} text="Solidity to EventB"/>
        <SideBarIcon icon={<SiJava size="20" />}  text="Java to EventB"/>
        <Divider />
        <SideBarIcon icon={<BsGearFill size="22" />} text="Setting"/>
    </div>
  );
};

const SideBarIcon = ({ icon, text = 'tooltip 💡' }) => (
  <div className="sidebar-icon group">
    {icon}
    <span class="sidebar-tooltip group-hover:scale-100">
      {text}
    </span>
  </div>
);


const Divider = () => <hr className="sidebar-hr" />;

export default SideBar;
