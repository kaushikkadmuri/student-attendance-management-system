const CounsellorTable = ({ counsellors, onEdit, onDelete, disableActions }) => {
  return (
    <div className="mt-6 bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="overflow-x-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-4 py-4">Name</th>
              <th className="px-4 py-4">Mobile</th>
              <th className="px-4 py-4">Email</th>
              <th className="px-4 py-4">Gender</th>
              <th className="px-4 py-4">Center</th>
              <th className="px-4 py-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {counsellors.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">
                  No counsellors found
                </td>
              </tr>
            ) : (
              counsellors.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4 font-medium text-gray-800">
                    <div className="break-words" title={c.name}>{c.name}</div>
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    <div className="break-words" title={c.mobile}>{c.mobile}</div>
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    <div className="break-all" title={c.email}>{c.email}</div>
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    <div className="break-words" title={c.gender}>{c.gender}</div>
                  </td>

                  <td className="px-4 py-4 text-gray-600">
                    <div className="break-words" title={c.centerName}>{c.centerName}</div>
                  </td>

                  <td className="px-4 py-4 text-center whitespace-nowrap">
                    <button
                      disabled={disableActions}
                      onClick={() => onEdit(c)}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-sm transition"
                    >
                      Edit
                    </button>

                    <button
                      disabled={disableActions}
                      onClick={() => onDelete(c.id)}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-sm transition ml-2"
                    >
                      Delete
                    </button>
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

export default CounsellorTable;
