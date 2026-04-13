
// const CenterTable = ({ centers, onEdit, onDelete }) => {
//   return (
//     <div className="mt-6 bg-white rounded-2xl shadow-md overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm text-left">
          
//           {/* Header */}
//           <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
//             <tr>
//               <th className="px-6 py-4">Center Name</th>
//               <th className="px-6 py-4">Location</th>
//               <th className="px-6 py-4">Latitude</th>
//               <th className="px-6 py-4">Longitude</th>
//               <th className="px-6 py-4">Allowed Radius</th>
//               <th className="px-6 py-4 text-center">Actions</th>
//             </tr>
//           </thead>

//           {/* Body */}
//           <tbody className="divide-y">
//             {centers.length === 0 ? (
//               <tr>
//                 <td colSpan="6" className="text-center py-8 text-gray-500">
//                   No centers found
//                 </td>
//               </tr>
//             ) : (
//               centers.map((c) => (
//                 <tr
//                   key={c.id}
//                   className="hover:bg-gray-50 transition duration-150"
//                 >
//                   <td className="px-6 py-4 font-medium text-gray-800">
//                     {c.name}
//                   </td>

//                   <td className="px-6 py-4 text-gray-600">
//                     {c.location}
//                   </td>

//                   <td className="px-6 py-4 text-gray-600">
//                     {c.latitude}
//                   </td>

//                   <td className="px-6 py-4 text-gray-600">
//                     {c.longitude}
//                   </td>

//                   <td className="px-6 py-4 text-gray-600">
//                     {c.allowed_radius} m
//                   </td>

//                   {/* Actions */}
//                   <td className="px-6 py-4 text-center space-x-2">
//                     <button
//                       onClick={() => onEdit(c)}
//                       className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm transition"
//                     >
//                       Edit
//                     </button>

//                     <button
//                       onClick={() => onDelete(c.id)}
//                       className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm transition"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>

//         </table>
//       </div>
//     </div>
//   );
// };

// export default CenterTable;

const CenterTable = ({ centers, onEdit, onDelete }) => {
  return (
    <div className="mt-6 bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm text-left">

          {/* Header */}
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 w-[18%]">Center Name</th>
              <th className="px-6 py-4 w-[18%]">Location</th>
              <th className="px-6 py-4 w-[15%]">Latitude</th>
              <th className="px-6 py-4 w-[15%]">Longitude</th>
              <th className="px-6 py-4 w-[14%]">Allowed Radius</th>
              <th className="px-6 py-4 w-[20%] text-center">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y">
            {centers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No centers found
                </td>
              </tr>
            ) : (
              centers.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-6 py-4 truncate">
                    {c.name}
                  </td>

                  <td className="px-6 py-4 truncate">
                    {c.location}
                  </td>

                  <td className="px-6 py-4">
                    {/* {c.latitude} */}
                    {Number(c.latitude).toFixed(6)}
                  </td>

                  <td className="px-6 py-4">
                    {/* {c.longitude}
                    
                    */}
                    {Number(c.longitude).toFixed(6)}
                  </td>

                  <td className="px-6 py-4">
                    {c.allowed_radius} m
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => onEdit(c)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(c.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default CenterTable;
